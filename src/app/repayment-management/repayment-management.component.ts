import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { LoanService, Loan } from '../services/loan.service';
import {
  RepaymentService,
  Repayment
} from '../services/repayment.service';

@Component({
  selector: 'app-repayment-management',
  templateUrl: './repayment-management.component.html',
  styleUrls: ['./repayment-management.component.css']
})
export class RepaymentManagementComponent implements OnInit {

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  loanList: Loan[] = [];
  repaymentList: Repayment[] = [];

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;
  selectedLoanId: number | null = null;

  loading = false;

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService,
    private repaymentService: RepaymentService
  ) {}

  ngOnInit(): void {
    this.loadCmrc();
  }

  loadCmrc(): void {
    this.cmrcService.getAll().subscribe({
      next: (data) => {
        this.cmrcList = data;
      },
      error: (error) => {
        console.error('CMRC API Error:', error);
      }
    });
  }

  loadVoAlfByCmrc(): void {

    this.voAlfList = [];
    this.loanList = [];
    this.repaymentList = [];

    this.selectedVoAlfId = null;
    this.selectedLoanId = null;

    if (!this.selectedCmrcId) {
      return;
    }

    this.voAlfService.getByCmrcId(this.selectedCmrcId).subscribe({
      next: (data) => {
        this.voAlfList = data;
      },
      error: (error) => {
        console.error('VO/ALF API Error:', error);
      }
    });
  }

  loadLoans(): void {

    this.loanList = [];
    this.repaymentList = [];
    this.selectedLoanId = null;

    if (!this.selectedVoAlfId) {
      return;
    }

    this.loanService.getByVoAlfId(this.selectedVoAlfId).subscribe({
      next: (data) => {
        this.loanList = data;
      },
      error: (error) => {
        console.error('Loan API Error:', error);
      }
    });
  }

  onLoanChange(): void {

    this.repaymentList = [];

    if (!this.selectedLoanId) {
      return;
    }

    this.loadOrGenerateSchedule();
  }

  loadOrGenerateSchedule(): void {

    if (!this.selectedLoanId) {
      return;
    }

    this.loading = true;

    this.repaymentService
      .getByLoanId(this.selectedLoanId)
      .subscribe({

        next: (data) => {

          if (data && data.length > 0) {

            // Schedule already exists
            this.repaymentList = data;
            this.loading = false;

          } else {

            // Generate new schedule
            this.generateSchedule();
          }
        },

        error: (error) => {

          console.error('Repayment API Error:', error);

          this.loading = false;
        }
      });
  }

  generateSchedule(): void {

    if (!this.selectedLoanId) {
      return;
    }

    this.repaymentService
      .generateSchedule(this.selectedLoanId)
      .subscribe({

        next: (data) => {

          this.repaymentList = data;
          this.loading = false;

        },

        error: (error) => {

          console.error('Generate Schedule Error:', error);

          this.loading = false;

          alert('Failed to generate repayment schedule');
        }
      });
  }

  payEmi(repayment: Repayment): void {

    if (!repayment.id) {
      return;
    }

    const scheduledAmount =
      Number(repayment.scheduledAmount ?? 0);

    const enteredAmount = prompt(
      `Enter paid amount for Installment ${repayment.installmentNo}`,
      scheduledAmount.toString()
    );

    if (enteredAmount === null) {
      return;
    }

    const paidAmount = Number(enteredAmount);

    if (isNaN(paidAmount) || paidAmount <= 0) {
      alert('Please enter a valid paid amount');
      return;
    }

    this.repaymentService
      .payEmi(repayment.id, paidAmount)
      .subscribe({

        next: (updated) => {

          const index = this.repaymentList.findIndex(
            r => r.id === updated.id
          );

          if (index !== -1) {
            this.repaymentList[index] = updated;
          }
        },

        error: (error) => {

          console.error('Pay EMI Error:', error);

          alert('Failed to pay EMI');
        }
      });
  }

  isPaid(repayment: Repayment): boolean {
    return repayment.paymentStatus === 'PAID';
  }

  getSelectedCmrcName(): string {

    const cmrc = this.cmrcList.find(
      c => c.id === this.selectedCmrcId
    );

    return cmrc?.cmrcName || '';
  }

  getSelectedVoAlfName(): string {

    const voAlf = this.voAlfList.find(
      v => v.id === this.selectedVoAlfId
    );

    return voAlf?.voAlfName || '';
  }

  getSelectedLoan(): Loan | undefined {

    return this.loanList.find(
      loan => loan.id === this.selectedLoanId
    );
  }
  getPaidCount(): number {
  return this.repaymentList.filter(
    r => r.paymentStatus === 'PAID'
  ).length;
}

getPendingCount(): number {
  return this.repaymentList.filter(
    r => r.paymentStatus !== 'PAID'
  ).length;
}
}