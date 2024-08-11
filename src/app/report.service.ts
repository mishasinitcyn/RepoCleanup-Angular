import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}

  getReport = (id: number): Observable<any> => this.http.get(`${environment.apiUrl}/reports/${id}`); 
  postReport = (reportData: any): Observable<any> => this.http.post(`${environment.apiUrl}/reports`, reportData);
  getOpenReport(creatorID: string, repoID: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/open/${creatorID}/${repoID}`)
      .pipe(
        map(report => (report)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 204) {
            return of({ exists: false, report: null }); // No existing report found
          }
          throw error;
        })
      );
  }
}