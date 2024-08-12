// shared-report.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../report.service';
import { IssuesService } from '../issues.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-shared-report',
  templateUrl: './shared-report.component.html',
  styleUrls: ['./shared-report.component.less']
})
export class SharedReportComponent implements OnInit {
  reportID: string;
  report: any;
  issues: any[] = [];

  constructor(private route: ActivatedRoute, private reportService: ReportService, private issuesService: IssuesService, private message: NzMessageService) {
    this.reportID = this.route.snapshot.paramMap.get('reportID') || '';
  }

  ngOnInit(): void {
    this.fetchReport();
  }

  fetchReport(): void {
    this.reportService.getReport(parseInt(this.reportID)).subscribe(
      (report) => {
        this.report = report;
        this.fetchFlaggedIssues();
      },
      (error) => this.message.error("Couldn't find the report by given id. It may have been closed or deleted.")
    );
  }

  fetchFlaggedIssues(): void {
    if (!this.report || !this.report.flaggedissues) {
      console.error('No flagged issues found in the report');
      return;
    }
  
    const numbers = this.report.flaggedissues.map((issue: any) => issue.number);

    this.issuesService.getIssuesByIssueNumbers(this.report.repoid, numbers).subscribe(
      (issues) => {
        this.issues = issues;
        this.applySpamLabels();
      },
      (error) => this.message.error("Couldn't fetch issues from Github")
    );
  }
  
  applySpamLabels(): void {
    this.issues.forEach(issue => {
      const flaggedIssue = this.report.flaggedissues.find((fi: any) => fi.number === issue.number);
      if (flaggedIssue) {
        issue.labels = issue.labels || [];
        if (!issue.labels.some((label: any) => label.name === 'spam')) {
          issue.labels.push({ name: 'spam', color: 'red' });
        }
      }
    });
  }
}