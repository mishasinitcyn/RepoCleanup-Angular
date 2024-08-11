import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IssuesService } from '../issues.service';
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
  isDarkMode = true;

  constructor(private authService: AuthService, private router: Router, private issuesService: IssuesService) {
    this.user$ = this.authService.getUser();
  }

  login = () => this.authService.login();
  logout = () => this.authService.logout();

  fetchIssues() {
    const repoPath = this.extractRepoPath(this.repoUrl);
    if (!repoPath) {
      this.fetchIssues_mock();
      return;
    }

    const [owner, repo] = repoPath.split('/');

    this.issuesService.fetchIssues(owner, repo).subscribe(
      repoData => {
        this.router.navigate(['/issues']);
      },
      error => alert('Error fetching issues')
    );
  }

  fetchIssues_mock(): void {
    this.issuesService.fetchIssues('mock', 'repo').subscribe(
      () => this.router.navigate(['/issues']),
      error => console.error('Error setting mock issues', error)
    );
  }

  private extractRepoPath(url: string): string | null {
    const match = url.match(/^https:\/\/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : null;
  }
}