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
import { CmrcBalanceComponent } from './cmrc-balance/cmrc-balance.component';
import { VoAlfComponent } from './vo-alf/vo-alf.component';
import { FundManagementComponent } from './fund-management/fund-management.component';
import { LoanManagementComponent } from './loan-management/loan-management.component';
import { RepaymentManagementComponent } from './repayment-management/repayment-management.component';

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
    CmrcBalanceComponent,
    VoAlfComponent,
    FundManagementComponent,
    LoanManagementComponent,
    RepaymentManagementComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }