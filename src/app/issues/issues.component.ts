// src/app/issues/issues.component.ts
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { IssuesService } from '../issues.service';
import { IssueTag } from '../interface';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.less']
})
export class IssuesComponent implements OnInit {
  @ViewChild('githubNotification', { static: true }) githubNotification!: TemplateRef<{}>;

  issues: any[] = [];
  showAlert: boolean = false;

  constructor(
    private issuesService: IssuesService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.issues = this.issuesService.getIssues();
    this.showNotification('Spam Detection', 'Spam detection in progress...');
  }

  showNotification(title: string, content: string): void {
    this.notification.template(this.githubNotification, {
      nzData: { title, content },
      nzPlacement: 'bottomRight',
      nzCloseIcon: '',
    },
  );
  }

  detectSpam(): void {
    this.showAlert = true;
    this.issuesService.sendIssues(this.issues).subscribe(
      (response: IssueTag[]) => {
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

  updateIssuesWithSpamLabels(issueTags: IssueTag[]): void {
    const spamLabel = {
      id: 7057394422,
      node_id: "LA_kwDOMEfBEs8AAAABpKdK9g",
      url: "https://api.github.com/repos/mishasinitcyn/RepoCleanup-backend/labels/ml",
      name: "spam",
      color: "FA4CAB",
      default: false,
      description: ""
    };

    issueTags.forEach(issueTag => {
      if (issueTag.label.toLowerCase() === 'spam') {
        const issue = this.issues.find(issue => issue.id === issueTag.id);
        if (issue) {
          issue.labels = issue.labels || [];
          if (!issue.labels.some((label: any) => label.name === 'spam')) {
            issue.labels.push(spamLabel);
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
}
