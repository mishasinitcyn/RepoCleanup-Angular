import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IssuesService } from '../issues.service';
import { mockIssues } from './mockIssues';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.less']
})
export class LandingPageComponent {
  constructor(private authService: AuthService, private router: Router, private issuesService: IssuesService) { }
  repoUrl: string = '';
  mockIssues: any[] = mockIssues;
  svgs: { path: string, color: string, position: { top: string, left: string } }[] = [];
  isDarkMode = true;


  ngOnInit(): void { }

  login() {
    this.authService.login();
  }

  fetchIssues(isGuest: boolean = false) {
    const repoPath = this.extractRepoPath(this.repoUrl);
    if (!repoPath) {
      alert('Invalid GitHub URL');
      return;
    }

    const [owner, repo] = repoPath.split('/');

    this.issuesService.fetchIssues(owner, repo).subscribe(
      data => {
        this.issuesService.setIssues(data);
        this.router.navigate(['/issues']);
      },
      error => alert('Error fetching issues')
    );
  }

  private extractRepoPath(url: string): string | null {
    const match = url.match(/^https:\/\/github\.com\/([^\/]+\/[^\/]+)$/);
    return match ? match[1] : null;
  }

  fetchIssues_mock(): void {
    this.issuesService.setIssues(this.mockIssues);
    this.router.navigate(['/issues']);
  }
}
