import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../services/report.service';
import { IssuesService } from '../services/issues.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { combineLatest, Observable, of, throwError } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ActionsService } from '../services/actions.service';

interface RecommendedAction {
  name: string;
  description: string;
  icon: string;
  functionCall: () => void;
  disabled?: boolean;
  loading?: boolean;
}

@Component({
  selector: 'app-shared-report',
  templateUrl: './shared-report.component.html',
  styleUrls: ['./shared-report.component.less']
})
export class SharedReportComponent implements OnInit {
  reportID: string;
  report: any;
  repoData: any;
  expandedIssueNumbers: number[] = [];
  isRepoOwner: boolean = false;
  currentUser: any;
  closedIssues: any[] = [];
  blockedUsers: Set<string> = new Set();

  recommendedActions: RecommendedAction[] = [];

  constructor(private route: ActivatedRoute, private reportService: ReportService, private issuesService: IssuesService, private authService: AuthService, 
              private message: NzMessageService, private modal: NzModalService, private actionsService: ActionsService) {
    this.reportID = this.route.snapshot.paramMap.get('reportID') || '';
  }

  hasEditPermission(): boolean { return !!this.currentUser && (this.currentUser.id == this.report.creatorid || this.currentUser.id === this.repoData.repoMetadata.owner.id); }
  getClosedIssues = (): any[] => this.closedIssues;

  ngOnInit(): void {
    this.fetchReportAndCheckOwnership();
  }

  initializeRecommendedActions() {
    this.recommendedActions = [
      { 
        name: "Secure Main Branch", 
        description: "Protect your main branch from direct pushes", 
        icon: "safety", 
        functionCall: () => this.secureMainBranch(),
        disabled: !this.isRepoOwner,
        loading: false
      },
      { 
        name: "Require PR Approvals", 
        description: "Set up a rule to require 2 approvals for PRs", 
        icon: "team", 
        functionCall: () => this.requirePRApprovals(),
        disabled: this.repoData?.repoMetadata?.private || !this.isRepoOwner || this.repoData.repoMetadata.owner.type != 'Organization',
        loading: false
      },
      { 
        name: "Add Templates", 
        description: "Create templates for Issues and Pull Requests", 
        icon: "file-text", 
        functionCall: () => this.addTemplates(),
        disabled: !this.isRepoOwner,
        loading: false
      },
    ];
  }

  fetchReportAndCheckOwnership(): void {
    const report$ = this.fetchReport();
    const user$ = this.authService.getUser();
  
    combineLatest([report$, user$]).pipe(
      map(([repoData, user]) => {
        this.currentUser = user;
        if (user && repoData && repoData.repoMetadata) {
          this.isRepoOwner = user.id === repoData.repoMetadata.owner.id;
        }
        return repoData;
      }),
      tap(repoData => {
        this.repoData = repoData;
        this.initializeRecommendedActions(); // Initialize actions after setting repoData
      })
    ).subscribe({
      error: (error) => this.message.error('An error occurred while fetching the report data.')
    });
  }

  fetchReport(): Observable<any> {
    return this.reportService.getReport(parseInt(this.reportID)).pipe(
      switchMap(response => {
        if (response.message === 'No report found') {
          throw new Error('No report found');
        }
        this.report = response;
        
        return this.issuesService.getRepoMetadataByID(this.report.repoid);
      }),
      switchMap(repoMetadata => {
        const owner = repoMetadata.owner.login;
        const repo = repoMetadata.name;
        const numbers = this.report.flaggedissues?.map((issue: any) => issue.number) || [];
        
        if (numbers.length === 0) return of({ repoMetadata, issues: [] });
  
        return this.issuesService.getIssuesByIssueNumbers(owner, repo, numbers).pipe(
          map(issues => ({ repoMetadata, issues }))
        );
      }),
      tap(repoData => {
        if (this.report.isopen) {
          this.repoData = repoData;
          this.categorizeIssues();
        }
      }),
      catchError(error => {
        if (error.message === 'No report found') {
          this.message.error('No report found with the given ID.');
        } else {
          this.message.error('An error occurred while fetching the report data.');
        }
        return of(null);
      })
    );
  }

  categorizeIssues(): void {
    this.closedIssues = [];
    this.repoData.issues = this.repoData.issues.filter((issue: any) => {
      const flaggedIssue = this.report.flaggedissues.find((fi: any) => fi.number === issue.number);
      if (flaggedIssue) {
        issue.labels = issue.labels || [];
        if (!issue.labels.some((label: any) => label.name === 'spam')) {
          issue.labels.push({ name: 'spam', color: 'red' });
        }
        if (issue.state === 'closed') {
          this.closedIssues.push(issue);
          return false;
        }
      }
      return true;
    });
  }

  unflagIssue(issue: any): void {
    if (!this.hasEditPermission()) {
      this.message.error('You do not have permission to edit this report.');
      return;
    }

    const index = this.report.flaggedissues.findIndex((i: any) => i.number === issue.number);
    
    if (index !== -1) {
      this.report.flaggedissues.splice(index, 1);
      this.repoData.issues.splice(index, 1);

      this.updateReport().subscribe(
        () => {
          this.message.success(`Unflagged issue #${issue.number}`);
        },
        (error) => {
          this.message.error(`Failed to unflag issue #${issue.number}`);
          // Revert the changes if update fails
          this.report.flaggedissues.splice(index, 0, issue);
          this.repoData.issues.splice(index, 0, issue);
        }
      );
    } else {
      this.message.error(`Issue #${issue.number} not found in the report`);
    }
  }

  closeIssue(issue: any): void {
    if (!this.hasEditPermission()) {
      this.message.error('You do not have permission to edit this report.');
      return;
    }
    if (!this.isRepoOwner) {
      this.message.error('Only repository owners can close issues as spam.');
      return;
    }
  
    const owner = this.repoData.repoMetadata.owner.login;
    const repo = this.repoData.repoMetadata.name;
  
    this.issuesService.lockIssue(owner, repo, issue.number).pipe(
      catchError(error => {
        this.message.error(`Failed to process issue #${issue.number}`);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.message.success(`Issue #${issue.number} locked, closed and labeled as spam`);
        
        // Update the issue in report.flaggedIssues
        const flaggedIssue = this.report.flaggedissues.find((i: any) => i.number === issue.number);
        if (flaggedIssue) {
          flaggedIssue.state = 'closed';
          flaggedIssue.labels = flaggedIssue.labels || [];
          if (!flaggedIssue.labels.includes('spam')) {
            flaggedIssue.labels.push('spam');
          }
        }
  
        // Move the issue to closedIssues
        const index = this.repoData.issues.findIndex((i: any) => i.number === issue.number);
        if (index !== -1) {
          const closedIssue = this.repoData.issues.splice(index, 1)[0];
          closedIssue.state = 'closed';
          this.closedIssues.push(closedIssue);
        }
  
        // Update the report
        this.updateReport();
      }
    });
  }

  closeReport(): void {
    if (!this.hasEditPermission()) {
      this.message.error('You do not have permission to close this report.');
      return;
    }

    this.report.isopen = false;

    this.reportService.updateReport(this.report).pipe(
      catchError(error => {
        this.message.error('Failed to close the report. Please try again.');
        return throwError(() => new Error('Failed to close report'));
      })
    ).subscribe(
      (response) => {
        if (response && response.report) {
          this.report = response.report;
          this.message.success('Report closed successfully');
        } else {
          this.message.warning('Report closed, but the response was unexpected');
        }
      }
    );
  }

  updateReport(): Observable<any> {
    const updatedReport = {
      ...this.report,
      flaggedissues: this.report.flaggedissues.map((issue: any) => ({
        ...issue,
        locked: issue.locked || false
      }))
    };
  
    return this.reportService.updateReport(updatedReport).pipe(
      tap(response => {
        if (response) {
          this.report = response.report;
        }
      }),
      catchError(error => {
        this.message.error('Failed to update the report');
        return throwError(() => new Error('Failed to update report'));
      })
    );
  }

  showUserConfirmation(issue: any, action: 'block' | 'unblock'): void {
    const title = action === 'block' ? `Block user ${issue.user.login}?` : `Unblock user ${issue.user.login}?`;
    const content = action === 'block' ? 'Are you sure you want to block this user?' : 'Are you sure you want to unblock this user?';

    this.modal.confirm({
      nzTitle: title,
      nzContent: content,
      nzOkText: 'Yes',
      nzNoAnimation: true,
      nzOkType: 'primary',
      nzOnOk: () => action === 'block' ? this.blockUser(issue) : this.unblockUser(issue),
      nzCancelText: 'No',
      nzBodyStyle: {
        backgroundColor: 'black',
        color: 'white',
      },
    });
  }

  expandIssue(issue: any): void {
    const index = this.expandedIssueNumbers.indexOf(issue.number);
    if (index === -1) {
      this.expandedIssueNumbers.push(issue.number);
    } else {
      this.expandedIssueNumbers.splice(index, 1);
    }
  }
  
  blockUser(issue: any): void {
    if (!this.isRepoOwner) {
      this.message.error('Only repository owners can block users.');
      return;
    }

    const owner = this.repoData.repoMetadata.owner.login;
    const username = issue.user.login;

    this.issuesService.blockUser(owner, username).pipe(
      catchError(error => {
        this.message.error(`Failed to block user ${username}`);
        return throwError(() => new Error('Failed to block user'));
      })
    ).subscribe(
      () => {
        this.message.success(`Blocked user ${username}`);
        this.blockedUsers.add(username);
      }
    );
  }

  unblockUser(issue: any): void {
    if (!this.isRepoOwner) {
      this.message.error('Only repository owners can unblock users.');
      return;
    }

    const owner = this.repoData.repoMetadata.owner.login;
    const username = issue.user.login;

    this.issuesService.unblockUser(owner, username).pipe(
      catchError(error => {
        this.message.error(`Failed to unblock user ${username}`);
        return throwError(() => new Error('Failed to unblock user'));
      })
    ).subscribe(
      () => {
        this.message.success(`Unblocked user ${username}`);
        this.blockedUsers.delete(username);
      }
    );
  }

  isUserBlocked(username: string): boolean {
    return this.blockedUsers.has(username);
  }

  secureMainBranch(): void {
    if (!this.isRepoOwner) {
      this.message.error('Only repository owners can perform this action.');
      return;
    }
  
    const action = this.recommendedActions.find(a => a.name === "Secure Main Branch");
    if (action) action.loading = true;
  
    const owner = this.repoData.repoMetadata.owner.login;
    const repo = this.repoData.repoMetadata.name;
  
    this.actionsService.secureMainBranch(owner, repo).pipe(
      catchError(error => {
        if (action) action.loading = false;
        if (error.message === 'No authentication token available') {
          this.message.error('You need to be authenticated to perform this action. Please log in.');
          this.authService.login();
        } else {
          this.message.error('Failed to secure main branch. Please try again.');
        }
        return throwError(() => error);
      })
    ).subscribe(
      () => {
        if (action) action.loading = false;
        this.message.success('Main branch secured successfully');
      }
    );
  }
  
  requirePRApprovals(): void {
    if (!this.isRepoOwner) {
      this.message.error('Only repository owners can perform this action.');
      return;
    }
  
    const action = this.recommendedActions.find(a => a.name === "Require PR Approvals");
    if (action) action.loading = true;
  
    const owner = this.repoData.repoMetadata.owner.login;
    const repo = this.repoData.repoMetadata.name;
  
    this.actionsService.requirePRApprovals(owner, repo).pipe(
      catchError(error => {
        if (error.message === 'No authentication token available') {
          this.message.error('You need to be authenticated to perform this action. Please log in.');
          this.authService.login();
        } else {
          if (action) action.loading = false;
          this.message.error('Failed to set PR approval rule. Please try again.');
        }
        return throwError(() => error);
      }),
    ).subscribe(
      () => {
        if (action) action.loading = false;
        this.message.success('PR approval rule set successfully');
      }
    );
  }
  
  addTemplates(): void {
    if (!this.isRepoOwner) {
      this.message.error('Only repository owners can perform this action.');
      return;
    }
  
    const action = this.recommendedActions.find(a => a.name === "Add Templates");
    if (action) action.loading = true;
  
    const owner = this.repoData.repoMetadata.owner.login;
    const repo = this.repoData.repoMetadata.name;
  
    this.actionsService.addTemplates(owner, repo).pipe(
      catchError(error => {
        if (action) action.loading = false;
        if (error.message === 'No authentication token available') {
          this.message.error('You need to be authenticated to perform this action. Please log in.');
          this.authService.login();
        } else {
          this.message.info("Couldn't add templates. Please .github folder for existing templates");
        }
        return throwError(() => error);
      })
    ).subscribe(
      () => {
        if (action) action.loading = false;
        this.message.success('Templates added successfully');
      }
    );
  }
}