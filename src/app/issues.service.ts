import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { RepoData } from './interface';
import { mockIssues } from './assets/mockIssues';

@Injectable({
  providedIn: 'root'
})
export class IssuesService {
  private repoDataSubject = new BehaviorSubject<RepoData | null>(null);

  constructor(private http: HttpClient, private authService: AuthService) { }

  sendIssues = (issues: any[]): Observable<any> => this.http.post(`${environment.fastApiUrl}/classify_spam`, issues);
  getRepoData = (): Observable<RepoData | null> => this.repoDataSubject.asObservable();

  fetchIssues(owner: string, repo: string): Observable<RepoData> {
    if (owner === 'mock' && repo === 'admin') {
      return of(mockIssues as RepoData).pipe(
        tap(repoData => this.repoDataSubject.next(repoData))
      );
    }

    return this.authService.getToken().pipe(
      switchMap(token => {
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        return this.http.get<RepoData>(`${environment.apiUrl}/github/${owner}/${repo}/issues`, { headers });
      }),
      tap(repoData => this.repoDataSubject.next(repoData))
    );
  }

  getIssuesByIssueNumbers(repoid: string, numbers: Number[]): Observable<any[]> {
    return this.authService.getToken().pipe(
      switchMap(token => {
        const params = new HttpParams().set('numbers', numbers.join(','));
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
        return this.http.get<any[]>(`${environment.apiUrl}/github/${repoid}/issues`, { params, headers });
      })
    );
  }
}