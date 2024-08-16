import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../services/report.service';
import { IssuesService } from '../services/issues.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-shared-report',
  templateUrl: './shared-report.component.html',
  styleUrls: ['./shared-report.component.less']
})
export class SharedReportComponent implements OnInit {
  reportID: string;
  report: any;
  repoData: any;
  expandedIssueNumbers: number[] = [];
  recommendedActions = [
    { name: "Secure Main Branch", description: "Protect your main branch from direct pushes", icon: "safety" },
    { name: "Require PR Approvals", description: "Set up a rule to require 2 approvals for PRs", icon: "team" },
    { name: "Add Templates", description: "Create templates for Issues and Pull Requests", icon: "file-text" },
  ];

  constructor(private route: ActivatedRoute, private reportService: ReportService, private issuesService: IssuesService, private message: NzMessageService, private authService: AuthService) {
    this.reportID = this.route.snapshot.paramMap.get('reportID') || '';
  }

  ngOnInit(): void {
    this.fetchReport();
  }

  fetchReport(): void {
    this.reportService.getReport(parseInt(this.reportID)).pipe(
      switchMap(response => {
        if (response.message === 'No report found') {
          throw new Error('No report found');
        }
        this.report = response;
        return this.issuesService.getRepoMetadataByID(this.report.repoid);
      }),
      switchMap(repoMetadata => {
        const owner = repoMetadata.owner.login;
        const repo = repoMetadata.name;
        const numbers = this.report.flaggedissues.map((issue: any) => issue.number);
        
        return this.issuesService.getIssuesByIssueNumbers(owner, repo, numbers).pipe(
          map(issues => ({ repoMetadata, issues }))
        );
      }),
    ).subscribe({
      next: ({ repoMetadata, issues }) => {
        this.repoData = { repoMetadata, issues };
        this.applySpamLabels();
        console.log(this.repoData)
      },
      error: (error) => {
        if (error.message === 'No report found') {
          this.message.error('No report found with the given ID.');
        } else {
          this.message.error('An error occurred while fetching the report data.');
        }
      }
    });
  }
  
  applySpamLabels(): void {
    this.repoData.issues.forEach((issue:any) => {
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