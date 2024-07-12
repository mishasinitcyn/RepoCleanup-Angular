import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-cleanup-report',
  templateUrl: './cleanup-report.component.html',
  styleUrls: ['./cleanup-report.component.less']
})
export class CleanupReportComponent {
  @Input() spamIssues: any[] = [];
  @Input() totalIssues: number = 0;
  @Output() removeSpamLabelEvent = new EventEmitter<any>()
  expandedIssueIds: number[] = [];

  get spamCount(): number {
    return this.spamIssues.length;
  }

  get spamRatio(): number {
    return (this.spamCount / this.totalIssues) * 100;
  }

  toggleIssue(issue: any): void {
    const index = this.expandedIssueIds.indexOf(issue.id);
    if (index === -1) {
      this.expandedIssueIds.push(issue.id);
    } else {
      this.expandedIssueIds.splice(index, 1);
    }
  }

  removeSpamLabel(issue: any): void {
    this.removeSpamLabelEvent.emit(issue);
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

  downloadTextReport() {
    const reportContent = this.spamIssues.map(issue =>
      `Title: ${issue.title}\nBody: ${issue.body}\nUsername: ${issue.user.login}\nDate: ${issue.created_at}\nIssue Number: ${issue.number}\nLabels: ${issue.labels.map((l: any) => l.name).join(', ')}\n\n`
    ).join('');

    this.downloadFile(reportContent, 'spam_issues_report.txt', 'text/plain');
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