import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './auth/auth.guard';
import { CmrcComponent } from './cmrc/cmrc.component';
import { VoAlfComponent } from './vo-alf/vo-alf.component';

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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }