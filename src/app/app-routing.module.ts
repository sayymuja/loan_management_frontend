
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { SuperAdminGuard } from './auth/super-admin.guard';

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
import { AiChatComponent } from './ai-chat/ai-chat.component';
import { UserManagementComponent } from './super-admin/user-management/user-management.component';
import { ApprovalRequestsComponent } from './approval-requests/approval-requests.component';
import { GroupMembersComponent } from './group-members/group-members.component';
import { LoanRepaymentComponent } from './loan-repayment/loan-repayment.component';

const routes: Routes = [

  // PUBLIC ROUTES
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },

  // PROTECTED ROUTES
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
  path: 'group-members',
  component: GroupMembersComponent,
  canActivate: [AuthGuard]
},
{
  path: 'loan-repayment',
  component: LoanRepaymentComponent,
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
  {
    path: 'ai-chat',
    component: AiChatComponent,
    canActivate: [AuthGuard]
  },

  // SUPER ADMIN - USER MANAGEMENT
  {
    path: 'super-admin/users',
    component: UserManagementComponent,
    canActivate: [AuthGuard, SuperAdminGuard]
  },

  // ADMIN - APPROVAL REQUESTS
  {
    path: 'approval-requests',
    component: ApprovalRequestsComponent,
    canActivate: [AuthGuard]
  },

  // DEFAULT ROUTES - ALWAYS KEEP AT THE END
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
