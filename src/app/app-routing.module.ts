import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './auth/auth.guard';
import { CmrcComponent } from './cmrc/cmrc.component';
import { VoAlfComponent } from './vo-alf/vo-alf.component';
import { FundManagementComponent } from './fund-management/fund-management.component';
import { LoanManagementComponent } from './loan-management/loan-management.component';
import { RepaymentManagementComponent } from './repayment-management/repayment-management.component';
import { ClScheduleComponent } from './cl-schedule/cl-schedule.component';

const routes: Routes = [
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
  path: 'dashboard',
  component: DashboardComponent,
   canActivate: [AuthGuard]
},
{
    path: 'cmrc',
    component: CmrcComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'vo-alf',
    component: VoAlfComponent,
    canActivate: [AuthGuard]
  },
   {
    path: 'fund-management',
    component: FundManagementComponent,
    canActivate: [AuthGuard]
  },
   {
    path: 'loan',
    component: LoanManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'repayment',
    component: RepaymentManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cl-schedule',
    component: ClScheduleComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }