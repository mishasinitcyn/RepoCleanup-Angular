// src/app/issues/issues.component.ts
import { Component, OnInit } from '@angular/core';
import { IssuesService } from '../issues.service';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.less']
})
export class IssuesComponent implements OnInit {
  issues: any[] = [];
  showAlert: boolean = false;

  constructor(private issuesService: IssuesService) { }

  ngOnInit(): void {
    this.issues = this.issuesService.getIssues();
  }

  detectSpam(): void {
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 3000); // Hide alert after 3 seconds
  }

  getLabelColor(label: string): string {
    const colorMapping: { [key: string]: string } = {
      'spam': 'red',
      'bug': 'orange',
      'feature': 'blue',
      'discussion': 'purple',
      'good-first-issue': 'teal',
      'suggestion': 'yellow'
    };
    return colorMapping[label.toLowerCase()] || 'default';
  }
}
