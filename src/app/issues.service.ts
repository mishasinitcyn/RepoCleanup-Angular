// src/app/issues.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IssuesService {
  private issues: any[] = [];

  setIssues(issues: any[]): void {
    this.issues = issues;
  }

  getIssues(): any[] {
    return this.issues;
  }
}
