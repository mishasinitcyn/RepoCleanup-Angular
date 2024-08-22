import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';
import { switchMap, tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RepoData } from '../core/interface';
import { mockIssues } from '../assets/mockIssues';

@Injectable({
  providedIn: 'root'
})
export class IssuesService {
  private repoDataSubject = new BehaviorSubject<RepoData | null>(null);

  constructor(private http: HttpClient, private authService: AuthService) { }

  sendIssues = (issues: any[]): Observable<any> => this.http.post(`${environment.fastApiUrl}/classify_spam`, issues);
  getRepoData = (): Observable<RepoData | null> => this.repoDataSubject.asObservable();

  getRepoMetadata(owner: string, repo: string): Observable<any> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        return this.http.get<any>(`${environment.apiUrl}/github/${owner}/${repo}/metadata`, { headers });
      })
    );
  }

  getRepoMetadataByID(repoid: string): Observable<any> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        return this.http.get<any>(`${environment.apiUrl}/github/${repoid}/metadata`, { headers });
      }),
      catchError(error => {
        return throwError(() => new Error('Failed to fetch repository metadata'));
      })
    );
  }

  fetchRepoData(owner: string, repo: string): Observable<RepoData> {
    if (owner === 'mock' && repo === 'mock') {
      return of(mockIssues as RepoData).pipe(
        tap(repoData => this.repoDataSubject.next(repoData))
      );
    }
  
    return this.authService.getToken().pipe(
      switchMap(token => {
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        return this.getRepoMetadata(owner, repo).pipe(
          switchMap(repoMetadata => 
            this.http.get<any[]>(`${environment.apiUrl}/github/${owner}/${repo}/issues`, { headers }).pipe(
              map(issues => ({ repoMetadata, issues } as RepoData))
            )
          ),
          tap(repoData => this.repoDataSubject.next(repoData))
        );
      })
    );
  }

  getIssuesByIssueNumbers(owner: string, repo: string, numbers: number[]): Observable<any[]> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        const params = new HttpParams().set('numbers', numbers.join(','));
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        return this.http.get<any[]>(`${environment.apiUrl}/github/${owner}/${repo}/issues/numbers`, { params, headers });
      }),
      catchError(error => throwError(() => new Error('Failed to fetch issues')))
    );
  }

  lockIssue(owner: string, repo: string, issueNumber: number): Observable<any> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('User not authenticated'));
        }
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        // Step 1: Lock the issue
        return this.http.put(
          `${environment.apiUrl}/github/${owner}/${repo}/issues/${issueNumber}/lock`,
          { lock_reason: 'spam' },
          { headers }
        ).pipe(
          // Step 2: Close the issue
          switchMap(() => this.closeIssue(owner, repo, issueNumber, headers)),
          // Step 3: Ensure "spam" label exists and add it to the issue
          switchMap(() => this.addSpamLabel(owner, repo, issueNumber, headers)),
          map(() => ({
            number: issueNumber,
            state: 'closed',
          }))
        );
      }),
      catchError(error => {
        return throwError(() => new Error('Failed to process issue'));
      })
    );
  }

  private closeIssue(owner: string, repo: string, issueNumber: number, headers: HttpHeaders): Observable<any> {
    return this.http.patch(
      `${environment.apiUrl}/github/${owner}/${repo}/issues/${issueNumber}`,
      { state: 'closed' },
      { headers }
    );
  }

  private addSpamLabel(owner: string, repo: string, issueNumber: number, headers: HttpHeaders): Observable<any> {
    return this.ensureSpamLabelExists(owner, repo, headers).pipe(
      switchMap(() => this.http.post(
        `${environment.apiUrl}/github/${owner}/${repo}/issues/${issueNumber}/labels`,
        { labels: ['spam'] },
        { headers }
      ))
    );
  }

  private ensureSpamLabelExists(owner: string, repo: string, headers: HttpHeaders): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/github/${owner}/${repo}/labels`,
      { name: 'spam', color: 'f5222d', description: 'Spam issue' },
      { headers }
    ).pipe(
      catchError(error => {
        if (error.status === 422) {
          // Label already exists, we can ignore this error
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }
}