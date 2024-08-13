import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { User } from './interface';
import { Octokit } from '@octokit/rest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);
  private octokit: Octokit | null = null;

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('github_token');
    if (token) {
      this.setToken(token);
    }
  }
  
  getToken = (): Observable<string | null> => this.tokenSubject.asObservable();
  isAuthenticated = (): boolean => !!this.tokenSubject.value;
  getUser = (): Observable<any | null> => this.userSubject.asObservable();

  login(): void {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${environment.githubClientId}&redirect_uri=${environment.githubRedirectUri}&scope=repo`;
    window.location.href = githubAuthUrl;
  }

  logout(): void {
    localStorage.removeItem('github_token');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.octokit = null;
  }

  handleCallback(code: string): Observable<any> {
    return this.http.post('/api/github/callback', { code }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.setToken(response.access_token);
        }
      })
    );
  }

  setToken(token: string): void {
    localStorage.setItem('github_token', token);
    this.tokenSubject.next(token);
    this.octokit = new Octokit({ auth: token });
    this.fetchUser();
  }

  private fetchUser(): void {
    if (this.octokit) {
      from(this.octokit.users.getAuthenticated()).pipe(
        tap(({ data }) => this.userSubject.next(data as User))
      ).subscribe();
    }
  }

  getIssues(owner: string, repo: string): Observable<any> {
    if (this.octokit) {
      return from(this.octokit.issues.listForRepo({
        owner,
        repo,
        per_page: 30,
        state: 'open'
      }));
    }
    return this.http.get(`/api/github/issues/${owner}/${repo}`);
  }
}