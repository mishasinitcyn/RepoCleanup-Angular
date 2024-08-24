import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  secureMainBranch(owner: string, repo: string): Observable<any> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No authentication token available');
        }
        return this.http.post(`${this.apiUrl}/github/${owner}/${repo}/secure-main-branch`, {}, { headers: this.getHeaders(token) });
      })
    );
  }

  requirePRApprovals(owner: string, repo: string): Observable<any> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No authentication token available');
        }
        return this.http.post(`${this.apiUrl}/github/${owner}/${repo}/require-pr-approvals`, {}, { headers: this.getHeaders(token) });
      })
    );
  }

  addTemplates(owner: string, repo: string): Observable<any> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No authentication token available');
        }
        return this.http.post(`${this.apiUrl}/github/${owner}/${repo}/add-templates`, {}, { headers: this.getHeaders(token) });
      })
    );
  }
}