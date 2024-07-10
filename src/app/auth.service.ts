// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    this.tokenSubject.next(localStorage.getItem('github_token'));
  }

  login(): void {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${environment.githubClientId}&redirect_uri=${environment.githubRedirectUri}&scope=repo`;
    window.location.href = githubAuthUrl;
  }

  handleCallback(code: string): Observable<any> {
    // TODO: This should be done in backend for security
    return this.http.post('/api/github/callback', { code });
  }

  setToken(token: string): void {
    localStorage.setItem('github_token', token);
    this.tokenSubject.next(token);
  }

  getToken(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  logout(): void {
    localStorage.removeItem('github_token');
    this.tokenSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }
}