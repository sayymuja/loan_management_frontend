import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
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
  @Input() loanId: number | null = null;
selectedLoan: Loan | null = null;

showPaymentModal = false;
selectedRepayment: Repayment | null = null;

paymentAmount = 0;
penaltyAmount = 0;

@Input() loan: Loan | null = null;
  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService,
    private repaymentService: RepaymentService
  ) {}

ngOnInit(): void {
  this.loadCmrc();

  if (this.loanId) {
    this.selectedLoanId = this.loanId;
    this.selectedLoan = this.loan;
    this.loadOrGenerateSchedule();
  }
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

  this.selectedRepayment = repayment;

  const scheduledAmount =
    Number(repayment.scheduledAmount ?? 0);

  const alreadyPaid =
    Number(repayment.paidAmount ?? 0);

  let remainingAmount = scheduledAmount - alreadyPaid;

  // Negative remaining prevent karo
  if (remainingAmount < 0) {
    remainingAmount = 0;
  }

  // PARTIAL hai to remaining amount,
  // otherwise full scheduled EMI
  if (repayment.paymentStatus === 'PARTIAL') {
    this.paymentAmount = remainingAmount;
  } else {
    this.paymentAmount = scheduledAmount;
  }

  // Existing penalty ho to woh show karo, otherwise 0
  this.penaltyAmount =
    Number(repayment.penaltyAmount ?? 0);

  this.showPaymentModal = true;
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
exportToExcel(): void {

  if (!this.repaymentList || this.repaymentList.length === 0) {
    alert('No repayment records available for export');
    return;
  }

  // ==============================
  // REPAYMENT DATA
  // ==============================

  const excelData = this.repaymentList.map((repayment, index) => ({
  'Sr. No.': index + 1,
  'Installment No.': repayment.installmentNo || '',
  'Installment Date': repayment.installmentDate || '',
  'Scheduled EMI': Number(repayment.scheduledAmount || 0),

  // PENDING = 0
  // PARTIAL = actual paid amount
  // PAID = actual paid amount
  'Paid Amount': Number(repayment.paidAmount || 0),

  'Principal': Number(repayment.principalAmount || 0),
  'Interest': Number(repayment.interestAmount || 0),
  'Penalty Amount': Number(repayment.penaltyAmount || 0),
  'Total Amount': Number(repayment.totalAmount || 0),

  'Status':
    repayment.paymentStatus === 'PAID'
      ? 'Paid'
      : repayment.paymentStatus === 'PARTIAL'
        ? 'Partial'
        : 'Pending'
}));


  // ==============================
  // TOTALS
  // ==============================

  const totalScheduledEmi =
    this.repaymentList.reduce(
      (total, repayment) =>
        total + Number(repayment.scheduledAmount || 0),
      0
    );

  const totalPaidAmount =
    this.repaymentList.reduce(
      (total, repayment) =>
        total + Number(
          repayment.paymentStatus === 'PAID'
            ? repayment.paidAmount || 0
            : 0
        ),
      0
    );

  const totalPrincipal =
    this.repaymentList.reduce(
      (total, repayment) =>
        total + Number(repayment.principalAmount || 0),
      0
    );

  const totalInterest =
    this.repaymentList.reduce(
      (total, repayment) =>
        total + Number(repayment.interestAmount || 0),
      0
    );

  const totalAmount =
    this.repaymentList.reduce(
      (total, repayment) =>
        total + Number(repayment.totalAmount || 0),
      0
    );

  const paidInstallments =
    this.repaymentList.filter(
      repayment => repayment.paymentStatus === 'PAID'
    ).length;

  const pendingInstallments =
    this.repaymentList.filter(
      repayment => repayment.paymentStatus !== 'PAID'
    ).length;


  // ==============================
  // WORKSHEET
  // ==============================

  const worksheet: XLSX.WorkSheet =
    XLSX.utils.json_to_sheet(excelData);


  // ==============================
  // SUMMARY
  // ==============================

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [],
      ['REPAYMENT SUMMARY'],
      ['Total Installments', this.repaymentList.length],
      ['Paid Installments', paidInstallments],
      ['Pending Installments', pendingInstallments],
      ['Total Scheduled EMI', totalScheduledEmi],
      ['Total Paid Amount', totalPaidAmount],
      ['Total Principal', totalPrincipal],
      ['Total Interest', totalInterest],
      ['Total Amount', totalAmount]
    ],
    {
      origin: `A${excelData.length + 3}`
    }
  );


  // ==============================
  // WORKBOOK
  // ==============================

  const workbook: XLSX.WorkBook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Repayment Schedule'
  );


  // ==============================
  // COLUMN WIDTH
  // ==============================

  worksheet['!cols'] = [
    { wch: 10 },  // Sr No
    { wch: 16 },  // Installment No
    { wch: 20 },  // Date
    { wch: 18 },  // Scheduled EMI
    { wch: 18 },  // Paid Amount
    { wch: 16 },  // Principal
    { wch: 16 },  // Interest
    { wch: 18 },  // Total
    { wch: 14 }   // Status
  ];


  // ==============================
  // FILE NAME
  // ==============================

  const fileName =
    `Loan_${this.selectedLoanId}_Repayment_Schedule.xlsx`;


  // ==============================
  // DOWNLOAD
  // ==============================

  XLSX.writeFile(workbook, fileName);
}
closePaymentModal(): void {
  this.showPaymentModal = false;
  this.selectedRepayment = null;
  this.paymentAmount = 0;
  this.penaltyAmount = 0;
}
confirmPayment(): void {

  if (!this.selectedRepayment?.id) {
    return;
  }

  if (!this.paymentAmount || this.paymentAmount <= 0) {
    alert('Please enter a valid paid amount');
    return;
  }

  if (this.penaltyAmount === null || this.penaltyAmount < 0) {
    alert('Please enter a valid penalty amount');
    return;
  }

  const repaymentId = this.selectedRepayment.id;
  const paidAmount = Number(this.paymentAmount);
  const penaltyAmount = Number(this.penaltyAmount);

  // ==========================================
  // PAID EMI → EDIT EXISTING PAYMENT
  // ==========================================
  if (this.selectedRepayment.paymentStatus === 'PAID') {

    this.repaymentService
      .editPaidEmi(
        repaymentId,
        paidAmount,
        penaltyAmount
      )
      .subscribe({

        next: (updated) => {

          const index = this.repaymentList.findIndex(
            r => r.id === updated.id
          );

          if (index !== -1) {
            this.repaymentList[index] = updated;
          }

          this.closePaymentModal();
        },

        error: (error) => {
          console.error('Edit Paid EMI Error:', error);
          alert('Failed to update payment');
        }
      });

    return;
  }

  // ==========================================
  // PENDING / PARTIAL → NEW PAYMENT
  // ==========================================
  this.repaymentService
    .payEmi(
      repaymentId,
      paidAmount,
      penaltyAmount
    )
    .subscribe({

      next: (updated) => {

        const index = this.repaymentList.findIndex(
          r => r.id === updated.id
        );

        if (index !== -1) {
          this.repaymentList[index] = updated;
        }

        this.closePaymentModal();
      },

      error: (error) => {
        console.error('Pay EMI Error:', error);
        alert('Failed to pay EMI');
      }
    });
}
getPartialCount(): number {
  return this.repaymentList.filter(
    repayment => repayment.paymentStatus === 'PARTIAL'
  ).length;
}
editPaidEmi(repayment: Repayment): void {

  if (!repayment.id) {
    return;
  }

  this.selectedRepayment = repayment;

  // Existing paid amount
  this.paymentAmount =
    Number(repayment.paidAmount || 0);

  // Existing penalty
  this.penaltyAmount =
    Number(repayment.penaltyAmount || 0);

  this.showPaymentModal = true;
}

}