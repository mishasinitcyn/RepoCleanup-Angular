import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IssuesService } from '../issues.service';
import { mockIssues } from './mockIssues';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.less']
})
export class LandingPageComponent {
  repoUrl: string = '';
  user$: Observable<any>;
  mockIssues: any[] = mockIssues;
  svgs: { path: string, color: string, position: { top: string, left: string } }[] = [];
  isDarkMode = true;
  
  constructor(private authService: AuthService, private router: Router, private issuesService: IssuesService) {
    this.user$ = this.authService.getUser();
  }
  


  ngOnInit(): void { }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  fetchIssues(isGuest: boolean = false) {
    const repoPath = this.extractRepoPath(this.repoUrl);
    if (!repoPath) {
      this.fetchIssues_mock();
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
