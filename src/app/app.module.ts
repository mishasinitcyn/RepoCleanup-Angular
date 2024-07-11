// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { IssuesComponent } from './issues/issues.component';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { GithubOutline, RadarChartOutline, FileMarkdownOutline, DownloadOutline } from '@ant-design/icons-angular/icons';
const icons = [GithubOutline, RadarChartOutline, FileMarkdownOutline, DownloadOutline];

import { IssuesService } from './issues.service';
import {MarkdownModule} from 'ngx-markdown'
import { Squiggly1Component } from './assets/squiggly1/squiggly1.component';
import { Squiggly2Component } from './assets/squiggly2/squiggly2.component';
import { CallbackComponent } from './callback/callback.component';
import { CleanupReportComponent } from './cleanup-report/cleanup-report.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    IssuesComponent,
    Squiggly1Component,
    Squiggly2Component,
    CallbackComponent,
    CleanupReportComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    NzButtonModule,
    NzInputModule,
    NzTabsModule,
    NzCardModule,
    NzTableModule,
    NzTagModule,
    NzPageHeaderModule,
    NzAlertModule,
    NzNotificationModule,
    NzSpaceModule,
    NzFlexModule,
    NzSpinModule,
    NzListModule,
    NzGridModule,
    NzIconModule.forRoot(icons),
    NzModalModule,
    NzTypographyModule,
    NzAvatarModule,
    ClipboardModule,
    NzMessageModule,
    MarkdownModule.forRoot(),
    RouterModule
  ],
  providers: [IssuesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
