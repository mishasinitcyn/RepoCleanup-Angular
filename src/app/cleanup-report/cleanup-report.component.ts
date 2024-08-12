import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ReportService } from '../report.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-cleanup-report',
  templateUrl: './cleanup-report.component.html',
  styleUrls: ['./cleanup-report.component.less']
})
export class CleanupReportComponent {
  @Input() repoData: any;
  @Input() user: any | null = null;
  @Output() removeSpamLabelEvent = new EventEmitter<any>()
  expandedIssueNumbers: number[] = [];

  get spamIssues(): any[] { return this.repoData ? this.repoData.issues.filter((issue: any) => this.hasSpamLabel(issue)) : []; }
  get totalIssues(): number { return this.repoData ? this.repoData.issues.length : 0; }
  get spamCount(): number { return this.spamIssues.length; }
  get spamRatio(): number { return (this.spamCount / this.totalIssues) * 100; }

  constructor(private reportService: ReportService, private message: NzMessageService, private modal: NzModalService) {}
  
  hasSpamLabel(issue: any): boolean { return issue.labels.some((label: any) => label.name === 'spam'); }
  removeSpamLabel = (issue: any): void => this.removeSpamLabelEvent.emit(issue);

  saveReport(): void {
    if (!this.repoData || !this.repoData.repoMetadata.id) {
      this.message.info('Please fetch issues from a repository');
      return;
    }
    if (!this.user) {
      this.message.info('Please log in to save report');
      return;
    }
  
    const flaggedIssues = this.spamIssues.map((issue:any) => ({
      number: issue.number,
      username: issue.user.login,
      label: 'spam'
    }));
  
    if (flaggedIssues.length === 0) {
      this.showDeleteConfirmation();
    } else {
      this.saveReportData(flaggedIssues);
    }
  }
  
  private saveReportData(flaggedIssues: any[]): void {
    const report = {
      creatorID: this.user.id,
      repoID: this.repoData.repoMetadata.id,
      repoOwnerID: this.repoData.repoMetadata.owner.id,
      flaggedissues: JSON.stringify(flaggedIssues)
    };
  
    this.reportService.postReport(report).subscribe(
      response => this.message.success('Report saved successfully'),
      error => this.message.error('Error saving report')
    );
  }
  
  private showDeleteConfirmation(): void {
    this.modal.confirm({
      nzTitle: 'Delete Report',
      nzContent: 'This will delete the existing report. Are you sure?',
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => this.deleteReport(),
      nzBodyStyle: {
        backgroundColor: 'black',
        color: 'white'
      },
      nzNoAnimation: true,
    });
  }
  
  private deleteReport(): void {
    this.reportService.deleteReport(this.user.id, this.repoData.repoMetadata.id).subscribe(
      response => {
        if (response.message === 'No report found to delete') {
          this.message.info('No existing report found to delete');
        } else {
          this.message.success('Report deleted successfully');
        }
      },
      error => this.message.error('Error deleting report: ' + error.message)
    );
  }


  expandIssue(issue: any): void {
    const index = this.expandedIssueNumbers.indexOf(issue.number);
    if (index === -1) {
      this.expandedIssueNumbers.push(issue.number);
    } else {
      this.expandedIssueNumbers.splice(index, 1);
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