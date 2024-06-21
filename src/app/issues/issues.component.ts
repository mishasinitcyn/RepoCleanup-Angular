import { Component, OnInit } from '@angular/core';
import { IssuesService } from '../issues.service';
import { IssueTag } from '../interface';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.less']
})
export class IssuesComponent implements OnInit {
  issues: any[] = [];
  showAlert: boolean = false;

  constructor(private issuesService: IssuesService) { }

  ngOnInit(): void {
    this.issues = this.issuesService.getIssues();
  }

  detectSpam(): void {
    this.showAlert = true;
    this.issuesService.sendIssues(this.issues).subscribe(
      (response: IssueTag[]) => {
        this.showAlert = false;
        console.log(response);
        this.updateIssuesWithSpamLabels(response);
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

    issueTags.forEach(tag => {
      console.log(tag)
      if (tag.label === 'spam') {
        console.log('searching for', tag.id, 'in issues')
        const issue = this.issues.find(issue => issue.id === tag.id);
        console.log(issue)
        if (issue) {
          issue.labels = issue.labels || [];
          if (!issue.labels.some((label: any) => label.name === 'spam')) {
            issue.labels.push(spamLabel);
          }
        }
      }
    });
    console.log(this.issues)
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
}
