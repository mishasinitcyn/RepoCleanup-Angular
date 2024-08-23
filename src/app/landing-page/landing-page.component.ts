import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IssuesService } from '../services/issues.service';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.less']
})
export class LandingPageComponent {
  repoUrl: string = '';
  user$: Observable<any>;
  isDarkMode = true;

  constructor(private authService: AuthService, private router: Router, private issuesService: IssuesService, private message: NzMessageService) {
    this.user$ = this.authService.getUser();
  }

  login = () => this.authService.login();
  logout = () => this.authService.logout();

  fetchRepoData() {
    const repoPath = this.extractRepoPath(this.repoUrl);
    if (!repoPath) {
      // this.fetchRepoData_mock();
      this.message.info("Please enter valid Github repository URL")
      return;
    }

    const [owner, repo] = repoPath.split('/');
    this.issuesService.fetchRepoData(owner, repo).subscribe(
      repoData => this.router.navigate(['/issues']),
      error => alert('Error fetching repository data')
    );
  }

  fetchRepoData_mock(): void {
    this.issuesService.fetchRepoData('mock', 'mock').subscribe(
      () => this.router.navigate(['/issues']),
    );
  }

  private extractRepoPath(url: string): string | null {
    const match = url.match(/^https:\/\/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : null;
  }
}