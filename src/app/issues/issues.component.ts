import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { IssuesService } from '../issues.service';
import { ReportService } from '../report.service';
import { colorMapping, FlaggedIssue, IssueLabel, SpamLabel } from '../interface';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Clipboard } from '@angular/cdk/clipboard';
import { AuthService } from '../auth.service';
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
  loadingClassification = false;
  isLoggedIn = false;
  user$: Observable<any>;
  currentUser: any | null = null;
  selectedTabIndex = 0;

  constructor(private issuesService: IssuesService, private reportService: ReportService, private authService: AuthService, private notification: NzNotificationService, private modal: NzModalService, private message: NzMessageService, private clipboard: Clipboard) {
    this.user$ = this.authService.getUser();
    this.user$.subscribe(user => this.currentUser = user);
  }

  ngOnInit(): void {
    this.initializeUserAndRepoData();
    this.checkLoginStatus();
  }

  login = () => this.authService.login();
  getSpamIssues = (): any[] => this.repoData ? this.repoData.issues.filter((issue: any) => this.hasSpamLabel(issue)) : [];
  hasSpamLabel = (issue: any): boolean => issue.labels.some((label: any) => label.name === 'spam');
  onTabChange = (event: any): void => this.selectedTabIndex = event.index;
  getLabelColor = (label: string): string => colorMapping[label.toLowerCase()] || 'default';
  
  checkLoginStatus(): void {
    this.authService.getToken().subscribe(token => {
      this.isLoggedIn = !!token;
      if (!this.isLoggedIn) this.showGithubNotification();
    });
  }

  showGithubNotification(): void {
    this.notification.template(this.githubNotification, {
      nzData: { title: 'GitHub Login', content: 'Please log in for full functionality' },
      nzPlacement: 'topRight',
      nzCloseIcon: undefined,
      nzDuration: 0
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
        const issue = this.repoData.issues.find((issue: any) => issue.id === IssueLabel.id);
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

  applyExistingReportLabels(flaggedIssues: any[]): void {
    flaggedIssues.forEach((flaggedIssue: FlaggedIssue) => {
      const issue = this.repoData.issues.find((issue: any) => issue.id === flaggedIssue.issue_id);
      if (issue) {
        this.addSpamLabel(issue);
      }
    });
    this.sortIssues();
  }

  private initializeUserAndRepoData(): void {
    combineLatest([
      this.user$,
      this.issuesService.getRepoData()
    ]).pipe(
      tap(this.updateUserAndRepoData.bind(this)),
      switchMap(this.fetchOpenReport.bind(this))
    ).subscribe(this.handleOpenReportResponse.bind(this));
  }
  
  private updateUserAndRepoData([user, repoData]: [any, any]): void {
    this.currentUser = user;
    this.repoData = repoData;
  }
  
  private fetchOpenReport([user, repoData]: [any, any]): Observable<any> {
    if (user && repoData) {
      return this.reportService.getOpenReport(user.id, repoData.repoMetadata.id).pipe(
        catchError(() => of(null))
      );
    }
    return of(null);
  }
  
  private handleOpenReportResponse(report: any): void {
    if (report) {
      this.message.success("Existing report imported");
      this.applyExistingReportLabels(report.flaggedissues);
    }
  }
}