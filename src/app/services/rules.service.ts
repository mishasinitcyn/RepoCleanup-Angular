import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RulesService {
  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('User not authenticated'));
        }
        return of(new HttpHeaders().set('Authorization', `Bearer ${token}`));
      })
    );
  }

  blockUser(org: string, username: string): Observable<any> {
    return this.getHeaders().pipe(
      switchMap(headers => 
        this.http.put(`${environment.apiUrl}/github/${org}/block/${username}`, {}, { headers })
      ),
      catchError(error => throwError(() => new Error('Failed to block user')))
    );
  }

  unblockUser(org: string, username: string): Observable<any> {
    return this.getHeaders().pipe(
      switchMap(headers => 
        this.http.delete(`${environment.apiUrl}/github/${org}/block/${username}`, { headers })
      ),
      catchError(error => throwError(() => new Error('Failed to unblock user')))
    );
  }

  secureMainBranch(owner: string, repo: string): Observable<any> {
    return this.getHeaders().pipe(
      switchMap(headers => 
        this.http.put(`${environment.apiUrl}/github/${owner}/${repo}/secure-main`, {}, { headers })
      ),
      catchError(error => throwError(() => new Error('Failed to secure main branch')))
    );
  }

  requirePRApprovals(owner: string, repo: string): Observable<any> {
    return this.getHeaders().pipe(
      switchMap(headers => 
        this.http.put(`${environment.apiUrl}/github/${owner}/${repo}/require-pr-approvals`, {}, { headers })
      ),
      catchError(error => throwError(() => new Error('Failed to set PR approval rule')))
    );
  }

  addTemplates(owner: string, repo: string): Observable<any> {
    return this.getHeaders().pipe(
      switchMap(headers => 
        this.http.put(`${environment.apiUrl}/github/${owner}/${repo}/add-templates`, {}, { headers })
      ),
      catchError(error => throwError(() => new Error('Failed to add templates')))
    );
  }
}