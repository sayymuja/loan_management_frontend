import { Component, Input, OnInit } from '@angular/core';
import { ClSchedule, ClScheduleService } from '../services/cl-schedule.service';
import { Loan, LoanService } from '../services/loan.service';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-cl-schedule',
  templateUrl: './cl-schedule.component.html',
  styleUrls: ['./cl-schedule.component.css']
})
export class ClScheduleComponent implements OnInit {

  loanList: Loan[] = [];
  scheduleList: ClSchedule[] = [];

  selectedLoanId: number | null = null;

  loading = false;
  @Input() loanId: number | null = null;

  constructor(
    private clScheduleService: ClScheduleService,
    private loanService: LoanService
  ) {}

  ngOnInit(): void {
     if (this.loanId) {

    this.selectedLoanId = this.loanId;

    this.generateSchedule();

  } else {

    this.loadLoans();

  }

  }

  loadLoans(): void {
    this.loanService.getAll().subscribe({
      next: (data) => {
        this.loanList = data;
      },
      error: (error) => {
        console.error(error);
        alert('Failed to load loans');
      }
    });
  }

  generateSchedule(): void {

    if (!this.selectedLoanId) {
      alert('Please select Loan first');
      return;
    }

    this.loading = true;

    this.clScheduleService.getByLoanId(this.selectedLoanId).subscribe({
  next: (existing) => {

    if (existing.length > 0) {
      this.scheduleList = existing;
      return;
    }

    this.clScheduleService
      .generateSchedule(this.selectedLoanId!)
      .subscribe(data => {
        this.scheduleList = data;
      });
  }
});
  }
  exportToExcel(): void {

  if (!this.scheduleList || this.scheduleList.length === 0) {
    alert('No CL Schedule records available for export');
    return;
  }

  // =========================================
  // SCHEDULE DATA
  // =========================================

  const excelData = this.scheduleList.map((schedule, index) => ({
    'Sr. No.': index + 1,
    'Installment No.': schedule.installmentNo || '',
    'Outstanding': Number(schedule.outstandingAmount || 0),
    'Principal': Number(schedule.principalAmount || 0),
    'Interest': Number(schedule.interestAmount || 0),
    'Monthly Installment':
      Number(schedule.monthlyInstallment || 0),
    'Average Installment':
      Number(schedule.averageMonthlyInstallment || 0),
    'Remark': schedule.remark || ''
  }));


  // =========================================
  // TOTALS
  // =========================================

  const totalPrincipal =
    this.scheduleList.reduce(
      (total, schedule) =>
        total + Number(schedule.principalAmount || 0),
      0
    );

  const totalInterest =
    this.scheduleList.reduce(
      (total, schedule) =>
        total + Number(schedule.interestAmount || 0),
      0
    );

  const totalMonthlyInstallment =
    this.scheduleList.reduce(
      (total, schedule) =>
        total + Number(schedule.monthlyInstallment || 0),
      0
    );

  const totalPayableAmount =
    totalPrincipal + totalInterest;


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
      ['CL SCHEDULE SUMMARY'],
      ['Total Installments', this.scheduleList.length],
      ['Total Principal', totalPrincipal],
      ['Total Interest', totalInterest],
      ['Total Monthly Installment', totalMonthlyInstallment],
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
    { wch: 18 },  // Installment
    { wch: 18 },  // Outstanding
    { wch: 18 },  // Principal
    { wch: 18 },  // Interest
    { wch: 22 },  // Monthly Installment
    { wch: 22 },  // Average Installment
    { wch: 30 }   // Remark
  ];


  // =========================================
  // WORKBOOK
  // =========================================

  const workbook: XLSX.WorkBook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'CL Schedule'
  );


  // =========================================
  // FILE NAME
  // =========================================

  const fileName =
    `Loan_${this.selectedLoanId}_CL_Schedule.xlsx`;


  // =========================================
  // DOWNLOAD
  // =========================================

  XLSX.writeFile(workbook, fileName);
}
}