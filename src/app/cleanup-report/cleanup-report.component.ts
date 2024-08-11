import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ReportService } from '../report.service';
import { IssuesService } from '../issues.service';

@Component({
  selector: 'app-cleanup-report',
  templateUrl: './cleanup-report.component.html',
  styleUrls: ['./cleanup-report.component.less']
})
export class CleanupReportComponent {
  @Input() repoData: any;
  @Input() user: any | null = null;
  @Output() removeSpamLabelEvent = new EventEmitter<any>()
  expandedIssueIds: number[] = [];

  get spamIssues(): any[] { return this.repoData ? this.repoData.issues.filter((issue: any) => this.hasSpamLabel(issue)) : []; }
  get totalIssues(): number { return this.repoData ? this.repoData.issues.length : 0; }
  get spamCount(): number { return this.spamIssues.length; }
  get spamRatio(): number { return (this.spamCount / this.totalIssues) * 100; }

  constructor(private reportService: ReportService, private issuesService: IssuesService) {}
  
  hasSpamLabel(issue: any): boolean { return issue.labels.some((label: any) => label.name === 'spam'); }
  removeSpamLabel = (issue: any): void => this.removeSpamLabelEvent.emit(issue);

  saveReport(): void {
    if (!this.repoData || !this.repoData.repoMetadata.id) {
      console.error('Repository ID is not available');
      return;
    }
    if (!this.user) {
      console.error('User must be logged in to save report');
      return;
    }
    const reportData = this.spamIssues.map((issue:any) => ({
      issue_id: issue.id,
      username: issue.user.login,
      label: 'spam'
    }));

    const report = {
      creatorGithubID: this.user.id,
      repoID: this.repoData.repoMetadata.id,
      repoAdminGithubID: this.repoData.repoMetadata.owner.id,
      reportContent: JSON.stringify(reportData)
    };

    this.reportService.postReport(report).subscribe(
      response => {
        console.log('Report saved successfully', response);
      },
      error => {
        console.error('Error saving report', error);
      }
    );
  }


  expandIssue(issue: any): void {
    const index = this.expandedIssueIds.indexOf(issue.id);
    if (index === -1) {
      this.expandedIssueIds.push(issue.id);
    } else {
      this.expandedIssueIds.splice(index, 1);
    }
  }

  get labelDistribution() {
    const distribution: { [key: string]: number } = {};
    this.spamIssues.forEach(issue => {
      issue.labels.forEach((label: any) => {
        if (label.name !== 'spam') {
          distribution[label.name] = (distribution[label.name] || 0) + 1;
        }
      });
    });
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  downloadMarkdownReport() {
const reportContent = `# Cleanup Report

## Summary
- Total Issues: ${this.totalIssues}
- Spam Issues: ${this.spamCount}
- Spam Ratio: ${this.spamRatio.toFixed(2)}%

## Label Distribution
${this.labelDistribution.map(([label, count]) => `- ${label}: ${count}`).join('\n')}

## Spam Issues

  ${this.spamIssues.map(issue => `
  ### Issue #${issue.number}: ${issue.title}
  - **ID**: ${issue.id}
  - **Username**: ${issue.user.login}
  - **Date**: ${issue.created_at}
  - **Labels**: ${issue.labels.map((l: any) => l.name).join(', ')}
  - **Body**: 
  \`\`\`\`
  ${issue.body.replace(/`/g, '\\`')}
  \`\`\`\`
  `).join('\n')}
  `;

    this.downloadFile(reportContent, 'spam_issues_report.md', 'text/markdown');
  }

  private downloadFile(content: string, fileName: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}