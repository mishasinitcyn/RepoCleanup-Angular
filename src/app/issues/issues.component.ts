import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { IssuesService } from '../services/issues.service';
import { ReportService } from '../services/report.service';
import { colorMapping, FlaggedIssue, IssueLabel, RepoData, SpamLabel } from '../core/interface';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Clipboard } from '@angular/cdk/clipboard';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.less']
})
export class IssuesComponent implements OnInit {
  @ViewChild('githubNotification', { static: true }) githubNotification!: TemplateRef<{}>;
  repoData: any;
  report: any;
  loadingClassification = false;
  isLoggedIn = false;
  selectedTabIndex = 0;
  currentPage = 1;

  hasSpamLabel = (issue: any): boolean => issue.labels.some((label: any) => label.name === 'spam');
  onTabChange = (event: any): void => this.selectedTabIndex = event.index;
  getLabelColor = (label: string): string => colorMapping[label.toLowerCase()] || 'default';

  constructor(private issuesService: IssuesService, private reportService: ReportService, private authService: AuthService, private notification: NzNotificationService, private modal: NzModalService, private message: NzMessageService, private clipboard: Clipboard) {}
  
  ngOnInit(): void {
    this.initializeRepoData();
    this.checkLoginStatus();
  }

  private initializeRepoData(): void {
    this.issuesService.getRepoData().pipe(
      tap(this.updateRepoData.bind(this)),
      switchMap(this.fetchOpenReport.bind(this)),
      switchMap(this.handleOpenReportResponse.bind(this))
    ).subscribe(
      () => {
        this.applyExistingReportLabels();
        this.sortIssues();
      },
      error => this.message.error('Error initializing data: ' + error.message)
    );
  }
  
  private updateRepoData(repoData: RepoData | null): void {
    this.repoData = repoData;
  }
  
  private fetchOpenReport(repoData: any): Observable<any> {
    if (repoData) {
      return this.authService.getUser().pipe(
        switchMap(user => {
          if (user) {
            return this.reportService.getOpenReport(user.id, repoData.repoMetadata.id);
          }
          return of({ exists: false, report: null });
        })
      );
    }
    return of({ exists: false, report: null });
  }

  private handleOpenReportResponse(response: { exists: boolean, report: any }): Observable<any> {
    if (response.exists && response.report) {
      this.report = response.report;
      // this.message.success("Existing report imported");
      return of(this.report);
    }
    return of(null);
  }

  private fetchMissingIssues(report: any): Observable<any> {
    if (!report || !this.repoData) return of(null);
    const existingIssueNumbers = new Set(this.repoData.issues.map((issue: any) => issue.number));
    const missingIssueNumbers = report.flaggedissues
      .filter((issue: FlaggedIssue) => !existingIssueNumbers.has(issue.number))
      .map((issue: FlaggedIssue) => issue.number);

    if (missingIssueNumbers.length === 0) return of(null);

    return this.issuesService.getIssuesByIssueNumbers(
      this.repoData.repoMetadata.owner.login,
      this.repoData.repoMetadata.name,
      missingIssueNumbers
    ).pipe(
      tap(missingIssues => {
        missingIssues.forEach((issue: any) => {
          const flaggedIssue = report.flaggedissues.find((fi: FlaggedIssue) => fi.number === issue.number);
          if (flaggedIssue) {
            flaggedIssue.state = issue.state;
          }
          this.repoData.issues.push(issue);
        });
      })
    );
  }

  onPageChange(page: number): void {
    if (this.repoData) {
      const { repoMetadata } = this.repoData;
      this.issuesService.fetchNextPage(repoMetadata.owner.login, repoMetadata.name, page)
        .subscribe(
          newRepoData => {
            this.repoData = newRepoData;
            this.currentPage = page;
            this.applyExistingReportLabels();
            this.sortIssues();
          },
          error => this.message.error('Error fetching page: ' + error.message)
        );
    }
  }

  private applyExistingReportLabels(): void {
    if (!this.report || !this.report.flaggedissues) return;

    const allCachedIssues = this.issuesService.getAllCachedIssues();
    this.report.flaggedissues.forEach((flaggedIssue: FlaggedIssue) => {
      const issue = allCachedIssues.find((issue: any) => issue.number === flaggedIssue.number);
      if (issue) {
        this.addSpamLabel(issue);
        issue.state = flaggedIssue.state;
      }
    });
  }

  private sortIssues(): void {
    if (this.repoData) {
      const allCachedIssues = this.issuesService.getAllCachedIssues();
      allCachedIssues.sort((a: any, b: any) => {
        const aIsSpam = a.labels.some((label: any) => label.name === 'spam');
        const bIsSpam = b.labels.some((label: any) => label.name === 'spam');
        if (aIsSpam === bIsSpam) {
          return a.state === 'closed' ? 1 : -1;
        }
        return aIsSpam ? -1 : 1; // Spam issues first
      });
    }
  }
  
  checkLoginStatus(): void {
    this.authService.getToken().subscribe(token => {
      this.isLoggedIn = Boolean(token);
      if (!this.isLoggedIn) this.showGithubNotification();
    });
  }

  showGithubNotification(): void {
    this.notification.template(this.githubNotification, {
      nzData: { title: 'GitHub Login', content: 'Please log in for full functionality' },
      nzPlacement: 'topRight',
      nzCloseIcon: ' ' as string,
      nzDuration: 2000
    });
  }

  detectSpam(): void {
    if (!this.repoData || !this.repoData.issues.length) return;
    
    this.loadingClassification = true;
    this.issuesService.sendIssues(this.repoData.issues).subscribe(
      (response: IssueLabel[]) => {
        this.loadingClassification = false;
        this.updateIssuesWithSpamLabels(response);
        this.sortIssues();
      },
      (error) => {
        this.message.error("Error detecting spam")
      }
    );
  }

  updateIssuesWithSpamLabels(IssueLabels: IssueLabel[]): void {
    IssueLabels.forEach(IssueLabel => {
      if (IssueLabel.label.toLowerCase() === 'spam') {
        const issue = this.repoData.issues.find((issue: any) => issue.number === IssueLabel.number);
        if (issue) {
          issue.labels = issue.labels || [];
          if (!issue.labels.some((label: any) => label.name === 'spam')) {
            issue.labels.push(SpamLabel);
          }
        }
      }
    });
  }

  addSpamLabel(issue: any): void {
    issue.labels = issue.labels || [];
    if (!issue.labels.some((label: any) => label.name === 'spam')) {
      issue.labels.push(SpamLabel);
      this.sortIssues();
    }
  }

  removeSpamLabel(issue: any): void {
    issue.labels = issue.labels.filter((label: any) => label.name !== 'spam');
    this.sortIssues();
  }

  showSpamModal(issue: any, action: 'add' | 'remove'): void {
    const isRemoveAction = action === 'remove';
    this.modal.confirm({
      nzTitle: isRemoveAction ? 'Remove spam label?' : 'Is this spam?',
      nzOnOk: () => isRemoveAction ? this.removeSpamLabel(issue) : this.addSpamLabel(issue),
      nzNoAnimation: true,
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzBodyStyle: {
        backgroundColor: 'black',
        color: 'white'
      },
    });
  }
}