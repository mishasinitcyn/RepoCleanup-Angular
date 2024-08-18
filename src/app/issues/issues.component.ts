import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { IssuesService } from '../services/issues.service';
import { ReportService } from '../services/report.service';
import { colorMapping, FlaggedIssue, IssueLabel, SpamLabel } from '../core/interface';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Clipboard } from '@angular/cdk/clipboard';
import { AuthService } from '../services/auth.service';
import { Observable, combineLatest, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

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
      switchMap(this.fetchOpenReport.bind(this))
    ).subscribe(this.handleOpenReportResponse.bind(this));
  }
  
  private updateRepoData(repoData: any): void {
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
  private handleOpenReportResponse(response: { exists: boolean, report: any }): void {
    if (response.exists && response.report) {
      this.report = response.report;
      this.message.success("Existing report imported");
      this.applyExistingReportLabels(response.report.flaggedissues);
    }
  }

  private applyExistingReportLabels(flaggedIssues: any[]): void {
    flaggedIssues.forEach((flaggedIssue: FlaggedIssue) => {
      const issue = this.repoData.issues.find((issue: any) => issue.number === flaggedIssue.number);
      if (issue) {
        this.addSpamLabel(issue);
      }
    });
    this.sortIssues();
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

  sortIssues(): void {
    this.repoData.issues.sort((a: any, b: any) => {
      const aIsSpam = a.labels.some((label: any) => label.name === 'spam');
      const bIsSpam = b.labels.some((label: any) => label.name === 'spam');
      return (aIsSpam === bIsSpam) ? 0 : aIsSpam ? -1 : 1;
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