import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}

  getReport = (id: number): Observable<any> => this.http.get(`${environment.apiUrl}/reports/${id}`); 
  postReport = (reportData: any): Observable<any> => this.http.post(`${environment.apiUrl}/reports`, reportData);
}