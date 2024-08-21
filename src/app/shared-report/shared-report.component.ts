import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../services/report.service';
import { IssuesService } from '../services/issues.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';

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
  recommendedActions = [
    { name: "Secure Main Branch", description: "Protect your main branch from direct pushes", icon: "safety" },
    { name: "Require PR Approvals", description: "Set up a rule to require 2 approvals for PRs", icon: "team" },
    { name: "Add Templates", description: "Create templates for Issues and Pull Requests", icon: "file-text" },
  ];

  constructor(private route: ActivatedRoute, private reportService: ReportService, private issuesService: IssuesService, private authService: AuthService, private message: NzMessageService) {
    this.reportID = this.route.snapshot.paramMap.get('reportID') || '';
  }

  ngOnInit(): void {
    this.fetchReportAndCheckOwnership();
  }

  fetchReportAndCheckOwnership(): void {
    const report$ = this.fetchReport();
    const user$ = this.authService.getUser();

    combineLatest([report$, user$]).pipe(
      map(([repoData, user]) => {
        if (user && repoData && repoData.repoMetadata) {
          this.isRepoOwner = user.login === repoData.repoMetadata.owner.login;
        }
        return repoData;
      }),
      tap(repoData => {
        this.repoData = repoData;
        this.applySpamLabels();
      })
    ).subscribe({
      error: (error) =>  this.message.error('An error occurred while fetching the report data.')
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
        const numbers = this.report.flaggedissues.map((issue: any) => issue.number);
        
        return this.issuesService.getIssuesByIssueNumbers(owner, repo, numbers).pipe(
          map(issues => ({ repoMetadata, issues }))
        );
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
  
  applySpamLabels(): void {
    this.repoData.issues.forEach((issue:any) => {
      const flaggedIssue = this.report.flaggedissues.find((fi: any) => fi.number === issue.number);
      if (flaggedIssue) {
        issue.labels = issue.labels || [];
        if (!issue.labels.some((label: any) => label.name === 'spam')) {
          issue.labels.push({ name: 'spam', color: 'red' });
        }
      }
    });
  }

  unflagIssue(issue: any): void {
    const index = this.report.flaggedissues.findIndex((i: any) => i.number === issue.number);
    
    if (index !== -1) {
      this.report.flaggedissues.splice(index, 1);
      this.repoData.issues.splice(index, 1);

      this.message.success(`Unflagged issue #${issue.number}`);
    } else {
      this.message.error(`Issue #${issue.number} not found in the report`);
    }
  }

  closeIssue(issue: any): void {
    if (!this.isRepoOwner) {
      this.message.error('Only repository owners can lock issues as spam.');
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
        this.message.success(`Issue #${issue.number} locked, closed, and labeled as spam`);
        
        // Update the issue in report.flaggedIssues
        const flaggedIssue = this.report.flaggedissues.find((i: any) => i.number === issue.number);
        if (flaggedIssue) {
          flaggedIssue.locked = true;
          flaggedIssue.state = 'closed';
          flaggedIssue.labels = flaggedIssue.labels || [];
          if (!flaggedIssue.labels.includes('spam')) {
            flaggedIssue.labels.push('spam');
          }
        }
  
        // Update the issue in repoData.issues
        const repoIssue = this.repoData.issues.find((i: any) => i.number === issue.number);
        if (repoIssue) {
          repoIssue.locked = true;
          repoIssue.state = 'closed';
          repoIssue.labels = repoIssue.labels || [];
          if (!repoIssue.labels.some((label: any) => label.name === 'spam')) {
            repoIssue.labels.push({ name: 'spam', color: 'b60205' });
          }
        }
  
        // Update the report
        this.updateReport();
      }
    });
  }

  updateReport(): void {
    const updatedReport = {
      ...this.report,
      flaggedissues: this.report.flaggedissues.map((issue: any) => ({
        ...issue,
        locked: issue.locked || false
      }))
    };
  
    this.reportService.updateReport(updatedReport).pipe(
      catchError(error => {
        this.message.error('Failed to update the report');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.report = response.report;
      }
    });
  }

  banUser(issue: any): void {
    // TODO: Implement ban user logic
    this.message.success(`Banned user ${issue.user.login}`);
  }

  expandIssue(issue: any): void {
    const index = this.expandedIssueNumbers.indexOf(issue.number);
    if (index === -1) {
      this.expandedIssueNumbers.push(issue.number);
    } else {
      this.expandedIssueNumbers.splice(index, 1);
    }
  }
}