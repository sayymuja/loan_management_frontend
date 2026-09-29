import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthInterceptor } from './auth/auth.interceptor';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { CmrcComponent } from './cmrc/cmrc.component';
import { VoAlfComponent } from './vo-alf/vo-alf.component';
import { FundManagementComponent } from './fund-management/fund-management.component';
import { LoanManagementComponent } from './loan-management/loan-management.component';
import { RepaymentManagementComponent } from './repayment-management/repayment-management.component';
import { ClScheduleComponent } from './cl-schedule/cl-schedule.component';
import { BankBalanceComponent } from './bank-balance/bank-balance.component';
import { InterestComponent } from './interest/interest.component';
import { NgChartsModule } from 'ng2-charts';
import { ReportComponent } from './report/report.component';
@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    LoginComponent,
    DashboardComponent,
    MainLayoutComponent,
    SidebarComponent,
    TopbarComponent,
    CmrcComponent,
    VoAlfComponent,
    FundManagementComponent,
    LoanManagementComponent,
    RepaymentManagementComponent,
    ClScheduleComponent,
    BankBalanceComponent,
    InterestComponent,
    ReportComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgChartsModule
    
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }