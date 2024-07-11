import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { User } from './interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('github_token');
    if (token) {
      this.tokenSubject.next(token);
      this.fetchUser();
    }
  }

  login(): void {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${environment.githubClientId}&redirect_uri=${environment.githubRedirectUri}&scope=repo`;
    window.location.href = githubAuthUrl;
  }

  logout(): void {
    localStorage.removeItem('github_token');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
  }

  handleCallback(code: string): Observable<any> {
    // TODO: This should be done in backend for security
    return this.http.post('/api/github/callback', { code });
  }

  setToken(token: string): void {
    localStorage.setItem('github_token', token);
    this.tokenSubject.next(token);
    this.fetchUser();
  }


  getToken(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getUser(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  private fetchUser(): void {
    this.http.get<User>('https://api.github.com/user', {
      headers: { Authorization: `token ${this.tokenSubject.value}` }
    }).pipe(
      tap(user => this.userSubject.next(user))
    ).subscribe();
  }
}