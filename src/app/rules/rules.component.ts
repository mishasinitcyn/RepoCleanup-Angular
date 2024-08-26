import { Component, OnInit } from '@angular/core';
import { IssuesService } from '../services/issues.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../services/auth.service';
import { ActionsService } from '../services/actions.service';
import { DebounceService } from '../services/debounce.service';
import { catchError, throwError } from 'rxjs';

interface RecommendedAction {
  name: string;
  description: string;
  icon: string;
  functionCall: () => void;
  disabled?: boolean;
  loading?: boolean;
}

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.less']
})
export class RulesComponent implements OnInit {
  repoData: any;
  currentUser: any;
  recommendedActions: RecommendedAction[] = [];

  constructor(private issuesService: IssuesService, private actionsService: ActionsService, private authService: AuthService, private message: NzMessageService, private debounceService: DebounceService) {}

  ngOnInit(): void {
    this.issuesService.getRepoData().subscribe(repoData => {
      this.repoData = repoData;
    });
  
    this.authService.getUser().subscribe(user => {
      this.currentUser = user;
      this.initializeRecommendedActions();
    });
  }

  isRepoOwner(): boolean { 
    return !!this.currentUser && (this.currentUser.id === this.repoData.repoMetadata.owner.id); 
  }

  initializeRecommendedActions() {
    this.recommendedActions = [
      { 
        name: "Secure Main Branch", 
        description: "Protect your main branch from direct pushes", 
        icon: "safety", 
        functionCall: () => this.secureMainBranch(),
        disabled: !this.isRepoOwner(),
        loading: false
      },
      { 
        name: "Add Templates", 
        description: "Create templates for Issues and Pull Requests", 
        icon: "file-text", 
        functionCall: () => this.addTemplates(),
        disabled: !this.isRepoOwner(),
        loading: false
      },
      { 
        name: "Require PR Approvals", 
        description: "Set up a rule to require 2 approvals for PRs", 
        icon: "team", 
        functionCall: () => this.requirePRApprovals(),
        disabled: !this.isRepoOwner() || this.repoData.repoMetadata.owner.type != 'Organization',
        loading: false
      },
    ];
  }
  
  secureMainBranch(): void {
    this.debounceService.debounce(() => {
      const action = this.recommendedActions.find(a => a.name === "Secure Main Branch");
      if (action) action.loading = true;

      const owner = this.repoData.repoMetadata.owner.login;
      const repo = this.repoData.repoMetadata.name;

      this.actionsService.secureMainBranch(owner, repo).pipe(
        catchError(error => {
          if (action) action.loading = false;
          this.message.error('Failed to secure main branch. Please try again.');
          return throwError(() => error);
        })
      ).subscribe(() => {
        if (action) action.loading = false;
        this.message.success('Main branch secured successfully');
      });
    });
  }

  requirePRApprovals(): void {
    this.debounceService.debounce(() => {
      const action = this.recommendedActions.find(a => a.name === "Require PR Approvals");
      if (action) action.loading = true;

      const owner = this.repoData.repoMetadata.owner.login;
      const repo = this.repoData.repoMetadata.name;

      this.actionsService.requirePRApprovals(owner, repo).pipe(
        catchError(error => {
          if (action) action.loading = false;
          this.message.error('Failed to set PR approval rule. Please try again.');
          return throwError(() => error);
        })
      ).subscribe(() => {
        if (action) action.loading = false;
        this.message.success('PR approval rule set successfully');
      });
    });
  }

  addTemplates(): void {
    this.debounceService.debounce(() => {
      const action = this.recommendedActions.find(a => a.name === "Add Templates");
      if (action) action.loading = true;

      const owner = this.repoData.repoMetadata.owner.login;
      const repo = this.repoData.repoMetadata.name;

      this.actionsService.addTemplates(owner, repo).pipe(
        catchError(error => {
          if (action) action.loading = false;
          this.message.info("Couldn't add templates. Please check .github folder for existing templates");
          return throwError(() => error);
        })
      ).subscribe(() => {
        if (action) action.loading = false;
        this.message.success('Templates added successfully');
      });
    });
  }
}