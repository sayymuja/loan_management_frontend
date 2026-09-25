import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { LoanService, Loan } from '../services/loan.service';

@Component({
  selector: 'app-loan-management',
  templateUrl: './loan-management.component.html',
  styleUrls: ['./loan-management.component.css']
})
export class LoanManagementComponent implements OnInit {

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  loanList: Loan[] = [];

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;

  showForm = false;
  isEditMode = false;

  newLoan: Loan = {
    voAlfId: 0
  };

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService
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
    this.selectedVoAlfId = null;

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

    if (!this.selectedVoAlfId) {
      return;
    }

    this.loanService.getByVoAlfId(this.selectedVoAlfId).subscribe({
      next: (data) => {
        this.loanList = data;

        console.log('Loan Data:', this.loanList);
      },
      error: (error) => {
        console.error('Loan API Error:', error);
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

  openAddForm(): void {

    if (!this.selectedVoAlfId) {
      alert('Please select VO / ALF first');
      return;
    }

    this.newLoan = {
      voAlfId: this.selectedVoAlfId
    };

    this.isEditMode = false;
    this.showForm = true;
  }

  closeForm(): void {

    this.showForm = false;

    this.newLoan = {
      voAlfId: this.selectedVoAlfId ?? 0
    };
  }

  saveLoan(): void {

    if (!this.selectedVoAlfId) {
      alert('Please select VO / ALF first');
      return;
    }

    this.newLoan.voAlfId = this.selectedVoAlfId;

    if (this.isEditMode && this.newLoan.id) {

      this.loanService.update(
        this.newLoan.id,
        this.newLoan
      ).subscribe({
        next: () => {
          this.closeForm();
          this.loadLoans();
        },
        error: (error) => {
          console.error('Update Loan Error:', error);
        }
      });

    } else {

      this.loanService.create(this.newLoan).subscribe({
        next: () => {
          this.closeForm();
          this.loadLoans();
        },
        error: (error) => {
          console.error('Create Loan Error:', error);
        }
      });

    }
  }

  openEditForm(loan: Loan): void {

    this.newLoan = {
      ...loan
    };

    this.isEditMode = true;
    this.showForm = true;
  }

  deleteLoan(id: number): void {

    if (!confirm('Are you sure you want to delete this loan record?')) {
      return;
    }

    this.loanService.delete(id).subscribe({
      next: () => {
        this.loadLoans();
      },
      error: (error) => {
        console.error('Delete Loan Error:', error);
      }
    });
  }
  calculateEmi(): void {
  const principal = this.newLoan.loanAmount;
  const annualRate = this.newLoan.interestRate;
  const months = this.newLoan.repaymentPeriodMonths;
  const type = this.newLoan.interestType;

  if (!principal || !annualRate || !months || !type) {
    this.newLoan.monthlyEmi = undefined;
    return;
  }

  if (type === 'FLAT') {
    const totalInterest =
      principal * annualRate / 100 * months / 12;

    this.newLoan.monthlyEmi =
      (principal + totalInterest) / months;

    return;
  }

  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    this.newLoan.monthlyEmi = principal / months;
    return;
  }

  this.newLoan.monthlyEmi =
    principal * monthlyRate *
    Math.pow(1 + monthlyRate, months) /
    (Math.pow(1 + monthlyRate, months) - 1);
}
numberToWords(amount: number): string {

  if (!amount || amount <= 0) {
    return '';
  }

  const ones = [
    '', 'One', 'Two', 'Three', 'Four',
    'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty',
    'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const convertBelowThousand = (num: number): string => {

    let result = '';

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }

    if (num > 0) {
      result += ones[num] + ' ';
    }

    return result.trim();
  };

  let result = '';

  const lakhs = Math.floor(amount / 100000);
  amount %= 100000;

  const thousands = Math.floor(amount / 1000);
  amount %= 1000;

  if (lakhs > 0) {
    result += convertBelowThousand(lakhs) + ' Lakh ';
  }

  if (thousands > 0) {
    result += convertBelowThousand(thousands) + ' Thousand ';
  }

  if (amount > 0) {
    result += convertBelowThousand(amount);
  }

  return result.trim() + ' Rupees Only';
}
}