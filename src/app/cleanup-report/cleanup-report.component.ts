import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { ReportService } from '../services/report.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AuthService } from '../services/auth.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { colorMapping } from '../core/interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cleanup-report',
  templateUrl: './cleanup-report.component.html',
  styleUrls: ['./cleanup-report.component.less']
})
export class CleanupReportComponent implements OnInit {
  @Input() repoData: any;
  @Input() report: any;
  @Output() removeSpamLabelEvent = new EventEmitter<any>()
  expandedIssueNumbers: number[] = [];
  closedIssues: any[] = [];

  get spamIssues(): any[] { return this.repoData ? this.repoData.issues.filter((issue: any) => this.hasSpamLabel(issue) && issue.state !== 'closed') : []; }
  get totalIssues(): number { return this.repoData ? this.repoData.issues.length : 0; }
  get spamCount(): number { return this.spamIssues.length; }
  get spamRatio(): number { return (this.spamCount / this.totalIssues) * 100; }

  constructor(private reportService: ReportService, private message: NzMessageService, private modal: NzModalService, private authService: AuthService, private clipboard: Clipboard, private router: Router) {}

  ngOnInit(): void {
    this.updateClosedIssues();
  }

  updateClosedIssues(): void {
    if (this.repoData && this.report) {
      this.closedIssues = this.repoData.issues.filter((issue: any) => {
        const isFlagged = this.report.flaggedissues.some((flaggedIssue: any) => flaggedIssue.number === issue.number);
        return isFlagged && issue.state === 'closed';
      });
    }
  }
  
  hasSpamLabel(issue: any): boolean { return issue.labels.some((label: any) => label.name === 'spam'); }
  removeSpamLabel = (issue: any): void => this.removeSpamLabelEvent.emit(issue);

  removeClosedIssue(issue: any): void {
    if (!this.report || !this.report.flaggedissues) {
      this.message.error('Report data is not available');
      return;
    }

    const index = this.report.flaggedissues.findIndex((flaggedIssue: any) => flaggedIssue.number === issue.number);
    if (index !== -1) {
      this.report.flaggedissues.splice(index, 1);
      this.updateClosedIssues();
      this.message.success(`Removed closed issue #${issue.number} from flagged issues`);
    } else {
      this.message.error(`Issue #${issue.number} not found in flagged issues`);
    }
  }

  saveReport(): void {
    if (!this.repoData || !this.repoData.repoMetadata.id) {
      this.message.info('Please fetch issues from a repository');
      return;
    }

    this.authService.getUser().pipe(
      switchMap(user => {
        if (!user) {
          this.message.info('Please log in to save report');
          return of(null);
        }

        const flaggedIssues = [...this.spamIssues, ...this.closedIssues].map((issue:any) => ({
          number: issue.number,
          username: issue.user.login,
          label: 'spam',
          state: issue.state
        }));

        if (flaggedIssues.length === 0) {
          this.showDeleteConfirmation(user.id);
          return of(null);
        } else {
          return this.saveReportData(flaggedIssues, user.id);
        }
      })
    ).subscribe();
  }
  
  private saveReportData(flaggedIssues: any[], userId: string): any {
    const report = {
      creatorID: userId,
      repoID: this.repoData.repoMetadata.id,
      repoOwnerID: this.repoData.repoMetadata.owner.id,
      flaggedissues: JSON.stringify(flaggedIssues)
    };
  
    this.reportService.postReport(report).subscribe(
      response => {
        this.report = {reportid: response.reportid}
        this.message.success('Report saved successfully');
      },
      error => this.message.error('Error saving report')
    );
  }

  copyReportUrlToClipboard(reportID: string): void {
    const url = `https://repocleanup.com/report/${reportID}`;
    if (this.clipboard.copy(url)) {
      this.message.success('Report URL copied to clipboard');
    } else {
      this.message.error('Failed to copy URL to clipboard');
    }
  }

  viewReport(reportID: string): void {
    this.router.navigate(['/report', reportID]);
  }
  
  private showDeleteConfirmation(userId: string): void {
    this.modal.confirm({
      nzTitle: 'Delete Report',
      nzContent: 'This will delete the existing report. Are you sure?',
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => this.deleteReport(userId),
      nzBodyStyle: {
        backgroundColor: 'black',
        color: 'white'
      },
      nzNoAnimation: true,
    });
  }
  
  private deleteReport(userId: string): void {
    this.reportService.deleteReport(userId, this.repoData.repoMetadata.id).subscribe(
      response => {
        if (response.message === 'No report found to delete') {
          this.message.info('No existing report found to delete');
        } else {
          this.message.success('Report deleted successfully');
        }
      },
      error => this.message.error('Error deleting report')
    );
  }


  getLabelColor(label: string): string {
    return colorMapping[label.toLowerCase()] || 'default';
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