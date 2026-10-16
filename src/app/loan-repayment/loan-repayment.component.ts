import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loan-repayment',
  templateUrl: './loan-repayment.component.html',
  styleUrls: ['./loan-repayment.component.css']
})
export class LoanRepaymentComponent implements OnInit {

  activeTab: 'loan' | 'repayment' = 'loan';

  constructor() { }

  ngOnInit(): void {
  }

  selectTab(tab: 'loan' | 'repayment'): void {
    this.activeTab = tab;
  }

}