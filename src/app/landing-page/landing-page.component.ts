// src/app/landing-page/landing-page.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IssuesService } from '../issues.service';
import {mockIssues} from './mockIssues'
import {SvgService} from '../svg.service'

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.less']
})
export class LandingPageComponent {
  repoUrl: string = '';
  mockIssues: any[] = mockIssues;
  svgs: { path: string, color: string, position: { top: string, left: string } }[] = [];
  isDarkMode = true;

  constructor(private http: HttpClient, private router: Router, private issuesService: IssuesService, private svgService:SvgService) { }

  ngOnInit(): void {
  }

  fetchIssues_real(): void {
    if (!this.repoUrl) {
      return;
    }

    const repoPath = this.extractRepoPath(this.repoUrl);
    if (!repoPath) {
      alert('Invalid GitHub URL');
      return;
    }

    const apiUrl = `https://api.github.com/repos/${repoPath}/issues`;

    this.http.get(apiUrl).subscribe(
      data => {
        console.log(data)
        this.issuesService.setIssues(data as any[]);
        this.router.navigate(['/issues']);
      },
      error => alert('Error fetching issues')
    );
  }

  private extractRepoPath(url: string): string | null {
    const match = url.match(/^https:\/\/github\.com\/([^\/]+\/[^\/]+)$/);
    return match ? match[1] : null;
  }

  fetchIssues(): void {
    // Use mock issues data instead of making an actual API call
    this.issuesService.setIssues(this.mockIssues);
    this.router.navigate(['/issues']);
  }
}
