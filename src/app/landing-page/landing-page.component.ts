// landing-page.component.ts

import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IssuesService } from '../services/issues.service';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DebounceService } from '../services/debounce.service';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.less']
})
export class LandingPageComponent {
  @ViewChild('learnMoreModal') learnMoreModalTemplate!: TemplateRef<{}>;
  repoUrl: string = '';
  user$: Observable<any>;
  isDarkMode = true;

  login = () => this.authService.login();
  logout = () => this.authService.logout();
  fetchRepoData = () => this.debounceService.debounce(() => this.processRepoUrl('/issues'));
  addRules = () => this.debounceService.debounce(() => this.processRepoUrl('/rules', -1));

  constructor(private authService: AuthService, private router: Router, private issuesService: IssuesService, private message: NzMessageService, private debounceService: DebounceService, private modal: NzModalService) {
    this.user$ = this.authService.getUser();
  }

  private processRepoUrl(navigateTo: string, page: number = 1) {
    const repoPath = this.extractRepoPath(this.repoUrl);
    if (!repoPath) {
      this.message.info("Please enter a valid Github repository URL");
      return;
    }

    const [owner, repo] = repoPath.split('/');
    this.issuesService.fetchRepoData(owner, repo, page).subscribe(
      repoData => this.router.navigate([navigateTo]),
      error => {
        if (error.status == 404) this.message.info('Please log in to fetch private repository')
        else this.message.error('Error fetching repository data')
      }
    );
  }

  private extractRepoPath(url: string): string | null {
    const match = url.match(/^https:\/\/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : null;
  }

  openLearnMoreModal(event: Event): void {
    event.preventDefault();
    this.modal.create({
      nzTitle: "Learn more",
      nzContent: this.learnMoreModalTemplate,
      nzFooter: null,
      // nzCloseIcon: undefined,
      nzWidth: 400,
      nzNoAnimation: true,
      nzClassName: 'learn-more-modal',
      nzBodyStyle: {
        backgroundColor: 'black',
        color: 'white'
      },
    });
  }
}