import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IssueLabel } from './interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IssuesService {
  private fastApiUrl = environment.fastApiUrl;
  private apiUrl = environment.apiUrl;
  private githubApiUrl = 'https://api.github.com';
  private issues: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService) { }

  sendIssues(issues: any[]): Observable<any> {
    return this.http.post(`${this.fastApiUrl}/classify_spam`, issues);
  }

  setIssues(issues: any[]): void {
    this.issues = issues;
  }

  getIssues(): any[] {
    return this.issues;
  }

  fetchIssues_(owner: string, repo: string): Observable<any[]> {
    const url = `${this.githubApiUrl}/${owner}/${repo}/issues`;
    const params = {
      per_page: '30',
      state: 'open'
    };
    return this.http.get<any[]>(url, { params });
  }

  fetchIssues(owner: string, repo: string): Observable<any[]> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        return this.http.get<any[]>(`${this.apiUrl}/github/issues/${owner}/${repo}`, { headers });
      })
    );
  }
}
