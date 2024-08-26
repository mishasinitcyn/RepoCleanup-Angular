import { Component, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IssuesService } from '../services/issues.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../services/auth.service';
import { RepoData } from '../core/interface';
import { ActionsService } from '../services/actions.service';

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

  constructor(private issuesService: IssuesService, private actionsService: ActionsService, private authService: AuthService, private message: NzMessageService) {}

  ngOnInit(): void {
    this.issuesService.getRepoData().subscribe(repoData =>{
      this.repoData = repoData;
    })
  
    this.authService.getUser().subscribe(user => {
      this.currentUser = user;
      this.initializeRecommendedActions()
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
        name: "Require PR Approvals", 
        description: "Set up a rule to require 2 approvals for PRs", 
        icon: "team", 
        functionCall: () => this.requirePRApprovals(),
        disabled: this.repoData?.repoMetadata?.private || !this.isRepoOwner,
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
    ];
  }
  
  secureMainBranch(): void {
    const action = this.recommendedActions.find(a => a.name === "Secure Main Branch");
    if (action) action.loading = true;

    const owner = this.repoData.repoMetadata.owner.login;
    const repo = this.repoData.repoMetadata.name;

    this.actionsService.secureMainBranch(owner, repo).subscribe(
      () => {
        if (action) action.loading = false;
        this.message.success('Main branch secured successfully');
      },
      (error) => {
        if (action) action.loading = false;
        this.message.error('Failed to secure main branch. Please try again.');
      }
    );
  }

  requirePRApprovals(): void {
    const action = this.recommendedActions.find(a => a.name === "Require PR Approvals");
    if (action) action.loading = true;

    const owner = this.repoData.repoMetadata.owner.login;
    const repo = this.repoData.repoMetadata.name;

    this.actionsService.requirePRApprovals(owner, repo).subscribe(
      () => {
        if (action) action.loading = false;
        this.message.success('PR approval rule set successfully');
      },
      (error) => {
        if (action) action.loading = false;
        this.message.error('Failed to set PR approval rule. Please try again.');
      }
    );
  }

  addTemplates(): void {
    const action = this.recommendedActions.find(a => a.name === "Add Templates");
    if (action) action.loading = true;

    const owner = this.repoData.repoMetadata.owner.login;
    const repo = this.repoData.repoMetadata.name;

    this.actionsService.addTemplates(owner, repo).subscribe(
      () => {
        if (action) action.loading = false;
        this.message.success('Templates added successfully');
      },
      (error) => {
        if (action) action.loading = false;
        this.message.error('Failed to add templates. Please try again.');
      }
    );
  }
}