import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { IssuesComponent } from './issues/issues.component';
import { CallbackComponent } from './assets/callback/callback.component';
import { AuthGuard } from './auth.guard';
import { SharedReportComponent } from './shared-report/shared-report.component';
import { RulesComponent } from './rules/rules.component';

const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'landing', component: LandingPageComponent },
  { path: 'rules', component: RulesComponent },
  { path: 'issues', component: IssuesComponent}, //, canActivate: [AuthGuard] },
  { path: 'callback', component: CallbackComponent},
  { path: 'report/:reportID', component: SharedReportComponent},
  { path: '**', component: LandingPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }