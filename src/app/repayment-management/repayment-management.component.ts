import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { LoanService, Loan } from '../services/loan.service';
import { RepaymentService, Repayment } from '../services/repayment.service';

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

  showForm = false;
  isEditMode = false;

  newRepayment: Repayment = {
    loanId: 0
  };

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

  loadRepayments(): void {

    this.repaymentList = [];

    if (!this.selectedLoanId) {
      return;
    }

    this.repaymentService.getByLoanId(this.selectedLoanId).subscribe({
      next: (data) => {
        this.repaymentList = data;
        console.log('Repayment Data:', this.repaymentList);
      },
      error: (error) => {
        console.error('Repayment API Error:', error);
      }
    });
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
openAddForm(): void {

  if (!this.selectedLoanId) {
    alert('Please select Loan first');
    return;
  }

  const loan = this.getSelectedLoan();

  this.newRepayment = {
    loanId: this.selectedLoanId,
    paidAmount: loan?.monthlyEmi ?? 0,
    principalAmount: 0,
    interestAmount: 0,
    totalAmount: loan?.monthlyEmi ?? 0,
    regularRepayment: 'Yes',
    penaltyAmount: 0
  };

  this.isEditMode = false;
  this.showForm = true;

  // Calculate automatically
  this.calculateRepayment();
}

  closeForm(): void {

    this.showForm = false;

    this.newRepayment = {
      loanId: this.selectedLoanId ?? 0
    };
  }
calculateRepayment(): void {

  const loan = this.getSelectedLoan();

  if (!loan) {
    return;
  }

  const paidAmount = Number(this.newRepayment.paidAmount ?? 0);

  if (paidAmount <= 0) {
    this.newRepayment.principalAmount = 0;
    this.newRepayment.interestAmount = 0;
    this.newRepayment.totalAmount = 0;
    return;
  }

  // Previous principal paid
  const previousPrincipal = this.repaymentList
    .filter(r => r.id !== this.newRepayment.id)
    .reduce(
      (sum, r) => sum + Number(r.principalAmount ?? 0),
      0
    );

  const loanAmount = Number(loan.loanAmount ?? 0);

  const outstandingPrincipal = Math.max(
    loanAmount - previousPrincipal,
    0
  );

  const annualRate = Number(loan.interestRate ?? 0);

  let interestAmount = 0;

  // REDUCING BALANCE
  if (loan.interestType === 'REDUCING') {

    const monthlyRate = annualRate / 12 / 100;

    interestAmount =
      outstandingPrincipal * monthlyRate;
  }

  // FLAT
  else if (loan.interestType === 'FLAT') {

    interestAmount =
      loanAmount * annualRate / 12 / 100;
  }

  interestAmount = Math.min(
    interestAmount,
    paidAmount
  );

  const principalAmount =
    paidAmount - interestAmount;

  this.newRepayment.interestAmount =
    Number(interestAmount.toFixed(2));

  this.newRepayment.principalAmount =
    Number(principalAmount.toFixed(2));

  this.newRepayment.totalAmount =
    Number(paidAmount.toFixed(2));
}

  saveRepayment(): void {

    if (!this.selectedLoanId) {
      alert('Please select Loan first');
      return;
    }

    this.newRepayment.loanId = this.selectedLoanId;
if (!this.newRepayment.paidAmount || this.newRepayment.paidAmount <= 0) {
  alert('Please enter EMI / Paid Amount');
  return;
}
    if (this.isEditMode && this.newRepayment.id) {

      this.repaymentService.update(
        this.newRepayment.id,
        this.newRepayment
      ).subscribe({
        next: () => {
          this.closeForm();
          this.loadRepayments();
        },
        error: (error) => {
          console.error('Update Repayment Error:', error);
        }
      });

    } else {

      this.repaymentService.create(this.newRepayment).subscribe({
        next: () => {
          this.closeForm();
          this.loadRepayments();
        },
        error: (error) => {
          console.error('Create Repayment Error:', error);
        }
      });

    }
  }

  openEditForm(repayment: Repayment): void {

    this.newRepayment = {
      ...repayment
    };

    this.isEditMode = true;
    this.showForm = true;
  }

  deleteRepayment(id: number): void {

    if (!confirm('Are you sure you want to delete this repayment record?')) {
      return;
    }

    this.repaymentService.delete(id).subscribe({
      next: () => {
        this.loadRepayments();
      },
      error: (error) => {
        console.error('Delete Repayment Error:', error);
      }
    });
  }
}