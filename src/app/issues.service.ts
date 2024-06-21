// src/app/issues.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IssueLabel } from './interface';

@Injectable({
  providedIn: 'root'
})
export class IssuesService {
  private apiUrl = 'http://localhost:8000';
  private githubApiUrl = 'https://api.github.com/repos';
  private issues: any[] = [];

  constructor(private http: HttpClient) { }

  sendIssues(issues: any[]): Observable<IssueLabel[]> {
    return this.http.post<IssueLabel[]>(`${this.apiUrl}/classify_spam`, issues);
  }

  setIssues(issues: any[]): void {
    this.issues = issues;
  }

  getIssues(): any[] {
    return this.issues;
  }

  fetchIssues(owner: string, repo: string): Observable<any[]> {
    const url = `${this.githubApiUrl}/${owner}/${repo}/issues`;
    const params = {
      per_page: '3',
      state: 'open'
    };
    console.log("SENDING API FOR ISSUES", url, {params})
    return this.http.get<any[]>(url, { params });
  }

  updateIssue(issue: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${issue.id}`, issue);
  }
}
