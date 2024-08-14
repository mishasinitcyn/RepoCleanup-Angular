import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../services/report.service';
import { IssuesService } from '../services/issues.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-shared-report',
  templateUrl: './shared-report.component.html',
  styleUrls: ['./shared-report.component.less']
})
export class SharedReportComponent implements OnInit {
  reportID: string;
  report: any;
  user$: Observable<any>;
  currentUser: any | null = null;
  spamIssues: any[] = [];
  expandedIssueNumbers: number[] = [];
  recommendedActions = [
    { name: "Secure Main Branch", description: "Protect your main branch from direct pushes", icon: "shield" },
    { name: "Require PR Approvals", description: "Set up a rule to require 2 approvals for PRs", icon: "team" },
    { name: "Add Templates", description: "Create templates for Issues and Pull Requests", icon: "file-text" },
  ];

  constructor(private route: ActivatedRoute, private reportService: ReportService, private issuesService: IssuesService, private message: NzMessageService, private authService: AuthService) {
    this.reportID = this.route.snapshot.paramMap.get('reportID') || '';
    this.user$ = this.authService.getUser();
    this.user$.subscribe(user => this.currentUser = user);
  }

  ngOnInit(): void {
    this.fetchReport();
  }

  login = () => this.authService.login();

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
        this.spamIssues = issues;
        this.applySpamLabels();
      },
      (error) => this.message.error("Couldn't fetch issues from Github")
    );
  }
  
  applySpamLabels(): void {
    this.spamIssues.forEach(issue => {
      const flaggedIssue = this.report.flaggedissues.find((fi: any) => fi.number === issue.number);
      if (flaggedIssue) {
        issue.labels = issue.labels || [];
        if (!issue.labels.some((label: any) => label.name === 'spam')) {
          issue.labels.push({ name: 'spam', color: 'red' });
        }
      }
    });
  }

  unflagIssue(issue: any): void {
    // TODO: Implement unflag logic
    this.message.success(`Unflagged issue #${issue.number}`);
  }

  closeIssue(issue: any): void {
    // TODO: Implement close issue logic
    this.message.success(`Closed issue #${issue.number} as spam`);
  }

  banUser(issue: any): void {
    // TODO: Implement ban user logic
    this.message.success(`Banned user ${issue.user.login}`);
  }

  expandIssue(issue: any): void {
    const index = this.expandedIssueNumbers.indexOf(issue.number);
    if (index === -1) {
      this.expandedIssueNumbers.push(issue.number);
    } else {
      this.expandedIssueNumbers.splice(index, 1);
    }
  }
}