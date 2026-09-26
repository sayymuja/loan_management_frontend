import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { LoanService, Loan } from '../services/loan.service';
import { CmrcBalance, CmrcBalanceService } from '../services/cmrc-balance.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-loan-management',
  templateUrl: './loan-management.component.html',
  styleUrls: ['./loan-management.component.css']
})
export class LoanManagementComponent implements OnInit {

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  loanList: Loan[] = [];
  cmrcBalance: number = 0;
totalReceivedFund: number = 0;
cmrcLeftAmount: number = 0;
showClSchedule = false;
selectedLoanId: number | null = null;
selectedLoan: Loan | null = null;
showRepayment = false;
selectedRepaymentLoanId: number | null = null;
selectedRepaymentLoan: Loan | null = null;

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
    private loanService: LoanService,
     private cmrcBalanceService: CmrcBalanceService
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
  this.cmrcBalance = 0;

  if (!this.selectedCmrcId) {
    return;
  }

  // Load VO / ALF
this.voAlfService.getByCmrcId(this.selectedCmrcId).subscribe({
  next: (data) => {

    this.voAlfList = data;

    // Total Received Fund of all VO / ALF
    const totalReceivedFund = this.voAlfList.reduce(
      (total, voAlf) =>
        total + Number(voAlf.receivedFund || 0),
      0
    );

    console.log('Total VO / ALF Received Fund:', totalReceivedFund);

  },
  error: (error) => {
    console.error('VO/ALF API Error:', error);
  }
});

  // Load CMRC Balance
  this.cmrcBalanceService
    .getByCmrcId(this.selectedCmrcId)
    .subscribe({
      next: (data: CmrcBalance[]) => {

        if (data && data.length > 0) {

          // Latest balance record
          const latestBalance = data[data.length - 1];

          this.cmrcBalance =
            Number(latestBalance.balanceAmount || 0);

        } else {
          this.cmrcBalance = 0;
        }

        console.log('CMRC Balance:', this.cmrcBalance);
      },

      error: (error) => {
        console.error('CMRC Balance API Error:', error);
        this.cmrcBalance = 0;
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
 getSelectedVoAlfRecievedFund(): number | string {

    const voAlf = this.voAlfList.find(
      v => v.id === this.selectedVoAlfId
    );

    return voAlf?.receivedFund || '';
  }
  globalSearch: string = '';

get filteredLoanList(): any[] {

  const search = this.globalSearch
    .toLowerCase()
    .trim();

  if (!search) {
    return this.loanList;
  }

  return this.loanList.filter(loan =>
    (loan.groupName || '').toLowerCase().includes(search) ||
    (loan.womanName || '').toLowerCase().includes(search) ||
    (loan.loanPurpose || '').toLowerCase().includes(search) ||
    String(loan.loanAmount || '').includes(search) ||
    String(loan.monthlyEmi || '').includes(search) ||
    String(loan.repaymentPeriodMonths || '').includes(search) ||
    String(loan.interestRate || '').includes(search)
  );
}
getTotalLoanAmount(): number {

  return this.filteredLoanList.reduce(
    (total, loan) => total + Number(loan.loanAmount || 0),
    0
  );
}
getRemainingAmount(): number {

  const receivedFund = Number(
    this.getSelectedVoAlfRecievedFund() || 0
  );

  const totalLoanAmount = this.getTotalLoanAmount();

  return receivedFund - totalLoanAmount;
}
openClSchedule(loan: Loan): void {

  if (!loan.id) {
    alert('Loan ID not found');
    return;
  }

  // Repayment close
  this.showRepayment = false;
  this.selectedRepaymentLoanId = null;
  this.selectedRepaymentLoan = null;

  // CL Schedule open
  this.selectedLoanId = loan.id;
  this.selectedLoan = loan;
  this.showClSchedule = true;

  setTimeout(() => {

    const element = document.getElementById('clScheduleSection');

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

  }, 100);
}
closeClSchedule(): void {

  this.showClSchedule = false;
  this.selectedLoanId = null;
  this.selectedLoan = null;

}
openRepayment(loan: Loan): void {

  if (!loan.id) {
    alert('Loan ID not found');
    return;
  }

  // CL Schedule close
  this.showClSchedule = false;
  this.selectedLoanId = null;
  this.selectedLoan = null;

  // Repayment open
  this.selectedRepaymentLoanId = loan.id;
  this.selectedRepaymentLoan = loan;
  this.showRepayment = true;

  setTimeout(() => {

    const element = document.getElementById('repaymentSection');

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

  }, 100);
}
closeRepayment(): void {
  this.showRepayment = false;
  this.selectedRepaymentLoanId = null;
  this.selectedRepaymentLoan = null;
}
exportToExcel(): void {

  if (!this.selectedVoAlfId) {
    alert('Please select VO / ALF first');
    return;
  }

  if (!this.filteredLoanList || this.filteredLoanList.length === 0) {
    alert('No loan records available for export');
    return;
  }

  const cmrcName = this.getSelectedCmrcName();
  const voAlfName = this.getSelectedVoAlfName();

  // =========================================
  // LOAN DATA
  // =========================================

  const excelData = this.filteredLoanList.map((loan, index) => ({
    'Sr. No.': index + 1,
    'CMRC Name': cmrcName,
    'VO / ALF Name': voAlfName,
    'Group Name': loan.groupName || '',
    'Woman Name': loan.womanName || '',
    'Loan Amount': Number(loan.loanAmount || 0),
    'Loan Purpose': loan.loanPurpose || '',
    'Loan Given Date': loan.loanGivenDate || '',
    'Repayment Period (Months)':
      Number(loan.repaymentPeriodMonths || 0),
    'Interest Rate (%)':
      Number(loan.interestRate || 0),
    'Interest Type':
      loan.interestType || '',
    'Monthly EMI':
      Number(loan.monthlyEmi || 0)
  }));


  // =========================================
  // TOTALS
  // =========================================

  const totalLoanAmount =
    this.filteredLoanList.reduce(
      (total, loan) =>
        total + Number(loan.loanAmount || 0),
      0
    );

  const totalMonthlyEmi =
    this.filteredLoanList.reduce(
      (total, loan) =>
        total + Number(loan.monthlyEmi || 0),
      0
    );

  const totalInterest =
    this.filteredLoanList.reduce(
      (total, loan) => {

        const principal =
          Number(loan.loanAmount || 0);

        const emi =
          Number(loan.monthlyEmi || 0);

        const months =
          Number(loan.repaymentPeriodMonths || 0);

        const totalPayable =
          emi * months;

        const interest =
          totalPayable - principal;

        return total + Math.max(interest, 0);
      },
      0
    );

  const totalPayableAmount =
    totalLoanAmount + totalInterest;


  // =========================================
  // WORKSHEET
  // =========================================

  const worksheet: XLSX.WorkSheet =
    XLSX.utils.json_to_sheet(excelData);


  // =========================================
  // SUMMARY
  // =========================================

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [],
      ['LOAN SUMMARY'],
      ['CMRC Name', cmrcName],
      ['VO / ALF Name', voAlfName],
      ['Total Loans', this.filteredLoanList.length],
      ['Total Loan Amount', totalLoanAmount],
      ['Total Monthly EMI', totalMonthlyEmi],
      ['Total Interest', totalInterest],
      ['Total Payable Amount', totalPayableAmount]
    ],
    {
      origin: `A${excelData.length + 3}`
    }
  );


  // =========================================
  // COLUMN WIDTH
  // =========================================

  worksheet['!cols'] = [
    { wch: 10 },  // Sr No
    { wch: 20 },  // CMRC
    { wch: 20 },  // VO / ALF
    { wch: 18 },  // Group
    { wch: 22 },  // Woman
    { wch: 18 },  // Loan Amount
    { wch: 25 },  // Purpose
    { wch: 18 },  // Given Date
    { wch: 24 },  // Period
    { wch: 18 },  // Interest Rate
    { wch: 18 },  // Interest Type
    { wch: 18 }   // EMI
  ];


  // =========================================
  // WORKBOOK
  // =========================================

  const workbook: XLSX.WorkBook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Loan Details'
  );


  // =========================================
  // FILE NAME
  // =========================================

  const fileName =
    `${cmrcName}_${voAlfName}_Loan_Report.xlsx`;


  // =========================================
  // EXPORT
  // =========================================

  XLSX.writeFile(workbook, fileName);
}
}