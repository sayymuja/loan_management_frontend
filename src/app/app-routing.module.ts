import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './auth/auth.guard';

import { DashboardComponent } from './dashboard/dashboard.component';
import { CmrcComponent } from './cmrc/cmrc.component';
import { VoAlfComponent } from './vo-alf/vo-alf.component';
import { FundManagementComponent } from './fund-management/fund-management.component';
import { LoanManagementComponent } from './loan-management/loan-management.component';
import { RepaymentManagementComponent } from './repayment-management/repayment-management.component';
import { ClScheduleComponent } from './cl-schedule/cl-schedule.component';
import { BankBalanceComponent } from './bank-balance/bank-balance.component';
import { InterestComponent } from './interest/interest.component';
import { ReportComponent } from './report/report.component';
import { VillageComponent } from './village/village.component';
import { GroupComponent } from './group/group.component';
import { WomenComponent } from './women/women.component';

const routes: Routes = [

  // ==========================================
  // PUBLIC ROUTES
  // No Sidebar / No Topbar
  // ==========================================

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'signup',
    component: SignupComponent
  },


  // ==========================================
  // PROTECTED ROUTES
  // Sidebar + Topbar
  // ==========================================

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
  },

  {
    path: 'bank-balance',
    component: BankBalanceComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'interest',
    component: InterestComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'reports',
    component: ReportComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'village',
    component: VillageComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'group',
    component: GroupComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'women',
    component: WomenComponent,
    canActivate: [AuthGuard]
  },


  // ==========================================
  // DEFAULT
  // ==========================================

  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: '/login'
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }