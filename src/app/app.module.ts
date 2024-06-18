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
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { IssuesService } from './issues.service';
import {MarkdownModule} from 'ngx-markdown'
import { SvgService } from './svg.service';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    IssuesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    NzButtonModule,
    NzInputModule,
    NzCardModule,
    NzTagModule,
    NzPageHeaderModule,
    NzAlertModule,
    MarkdownModule.forRoot(),
    RouterModule
  ],
  providers: [IssuesService, SvgService],
  bootstrap: [AppComponent]
})
export class AppModule { }
