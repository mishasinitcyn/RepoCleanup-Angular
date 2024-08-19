import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}

  getReport(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/${id}`, { observe: 'response' }).pipe(
      map(response => (response.status === 204) ? { message: 'No report found' } : response.body),
      catchError(error => { throw error; })
    );
  }
  postReport = (reportData: any): Observable<any> => this.http.post(`${environment.apiUrl}/reports`, reportData);
  getOpenReport(creatorID: string, repoID: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/open/${creatorID}/${repoID}`, { observe: 'response' })
      .pipe(
        map(response => response.status === 204 ? { exists: false, report: null } : { exists: true, report: response.body }),
        catchError(error => { throw error; })
      );
  }
  deleteReport(creatorID: string, repoID: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/reports/${creatorID}/${repoID}`, { observe: 'response' })
      .pipe(
        map(response => response.status === 204 ? { message: 'No report found to delete' } : response.body),
        catchError(error => { throw error; })
      );
  }
}