import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { IssuesService } from '../issues.service';
import { IssueLabel, SpamLabel } from '../interface';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.less']
})
export class IssuesComponent implements OnInit {
  @ViewChild('githubNotification', { static: true }) githubNotification!: TemplateRef<{}>;

  issues: any[] = [];
  showAlert = false;

  constructor(
    private issuesService: IssuesService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private message: NzMessageService,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    this.issues = this.issuesService.getIssues();
    this.showNotification('Spam Detection', 'Spam detection in progress...');
  }

  showNotification(title: string, content: string): void {
    this.notification.template(this.githubNotification, {
      nzData: { title, content },
      nzPlacement: 'topRight',
      nzCloseIcon: undefined,
    });
  }

  detectSpam(): void {
    if (!this.issues.length){
      return
    }
    this.showAlert = true;
    this.issuesService.sendIssues(this.issues).subscribe(
      (response: IssueLabel[]) => {
        this.showAlert = false;
        console.log(response);
        this.updateIssuesWithSpamLabels(response);
        this.sortIssues();
      },
      (error) => {
        console.error('Error sending issues:', error);
      }
    );
  }

  updateIssuesWithSpamLabels(IssueLabels: IssueLabel[]): void {
    IssueLabels.forEach(IssueLabel => {
      if (IssueLabel.label.toLowerCase() === 'spam') {
        const issue = this.issues.find(issue => issue.id === IssueLabel.id);
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
    this.issues.sort((a, b) => {
      const aIsSpam = a.labels.some((label: any) => label.name === 'spam');
      const bIsSpam = b.labels.some((label: any) => label.name === 'spam');
      return (aIsSpam === bIsSpam) ? 0 : aIsSpam ? -1 : 1;
    });
  }

  getLabelColor(label: string): string {
    const colorMapping: { [key: string]: string } = {
      'spam': 'red',
      'bug': 'orange',
      'feature': 'blue',
      'discussion': 'purple',
      'good-first-issue': 'teal',
      'suggestion': 'yellow'
    };
    return colorMapping[label.toLowerCase()] || 'default';
  }

  hasSpamLabel(issue: any): boolean {
    return issue.labels.some((label: any) => label.name === 'spam');
  }

  showRemoveSpamModal(issue: any): void {
    this.modal.confirm({
      nzTitle: 'Remove spam label?',
      nzOnOk: () => this.removeSpamLabel(issue),
      nzOnCancel: () => console.log('Cancel'),
      nzNoAnimation: true,
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzBodyStyle: {
        backgroundColor: 'black',
        color: 'white'
      },
    });
  }

  removeSpamLabel(issue: any): void {
    issue.labels = issue.labels.filter((label: any) => label.name !== 'spam');
    this.sortIssues();
  }

  showAddSpamModal(issue: any): void {
    this.modal.confirm({
      nzTitle: 'Is this spam?',
      nzOnOk: () => this.addSpamLabel(issue),
      nzOnCancel: () => console.log('Cancel'),
      nzNoAnimation: true,
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzBodyStyle: {
        backgroundColor: 'black',
        color: 'white'
      },
    });
  }

  addSpamLabel(issue: any): void {
    issue.labels = issue.labels || [];
    if (!issue.labels.some((label: any) => label.name === 'spam')) {
      issue.labels.push(SpamLabel);
      this.sortIssues();
    }
  }

  showCleanupReport(): void {
    const spamIssues = this.issues.filter(issue => this.hasSpamLabel(issue));
    const reportContent = spamIssues.map(issue => `${issue.id}`).join(',');

    this.modal.create({
      nzTitle: 'Cleanup Report',
      nzContent: `
        <p>Issues marked as spam:</p>
        <textarea readonly rows="10" style="width: 100%;">${reportContent}</textarea>
      `,
      nzFooter: [
        {
          label: 'Copy to Clipboard',
          onClick: () => {
            this.clipboard.copy(reportContent);
            this.message.success('Report copied to clipboard');
          }
        },
        // {
        //   label: 'Close',
        //   onClick: () => {}
        // }
      ],
      nzWidth: 600,
    });
  }
}
