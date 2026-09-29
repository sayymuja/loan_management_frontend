import { Component, Input, OnInit } from '@angular/core';
import { ClSchedule, ClScheduleService } from '../services/cl-schedule.service';
import { Loan, LoanService } from '../services/loan.service';
import { Cmrc, CmrcService } from '../services/cmrc.service';
import { VoAlf, VoAlfService } from '../services/vo-alf.service';
import * as XLSX from 'xlsx';

@Component({
selector: 'app-cl-schedule',
templateUrl: './cl-schedule.component.html',
styleUrls: ['./cl-schedule.component.css']
})
export class ClScheduleComponent implements OnInit {

// =========================================
// LISTS
// =========================================

cmrcList: Cmrc[] = [];

voAlfList: VoAlf[] = [];

loanList: Loan[] = [];

filteredLoanList: Loan[] = [];

scheduleList: ClSchedule[] = [];

// =========================================
// SELECTED VALUES
// =========================================

selectedCmrcId: number | null = null;

selectedVoAlfId: number | null = null;

selectedLoanId: number | null = null;

selectedLoan: Loan | null = null;

// =========================================
// STATUS
// =========================================

loading = false;

// =========================================
// INPUT FROM PARENT
// =========================================

@Input() loanId: number | null = null;

constructor(
private clScheduleService: ClScheduleService,
private loanService: LoanService,
private cmrcService: CmrcService,
private voAlfService: VoAlfService
) {}

// =========================================
// INIT
// =========================================

ngOnInit(): void {


this.loadCmrc();

this.loadLoans();


// If Loan ID comes from Loan Management
if (this.loanId) {

  this.selectedLoanId = this.loanId;

  this.loadSelectedLoan();

}


}

// =========================================
// LOAD CMRC
// =========================================

loadCmrc(): void {


this.cmrcService.getAll().subscribe({

  next: (data) => {

    this.cmrcList = data || [];

  },

  error: (error) => {

    console.error(
      'CMRC API Error:',
      error
    );

  }

});


}

// =========================================
// LOAD VO / ALF BY CMRC
// =========================================

onCmrcChange(): void {


// Reset dependent selections

this.selectedVoAlfId = null;

this.selectedLoanId = null;

this.selectedLoan = null;

this.voAlfList = [];

this.filteredLoanList = [];

this.scheduleList = [];


if (!this.selectedCmrcId) {

  return;

}


this.voAlfService
  .getByCmrcId(this.selectedCmrcId)
  .subscribe({

    next: (data) => {

      this.voAlfList = data || [];

    },

    error: (error) => {

      console.error(
        'VO / ALF API Error:',
        error
      );

      this.voAlfList = [];

    }

  });


}

// =========================================
// VO / ALF CHANGE
// =========================================

onVoAlfChange(): void {


this.selectedLoanId = null;

this.selectedLoan = null;

this.filteredLoanList = [];

this.scheduleList = [];


if (!this.selectedVoAlfId) {

  return;

}


this.filteredLoanList =
  this.loanList.filter(

    loan =>
      Number(loan.voAlfId) ===
      Number(this.selectedVoAlfId)

  );


}

// =========================================
// LOAN CHANGE
// =========================================

onLoanChange(): void {


this.scheduleList = [];

this.selectedLoan = null;


if (!this.selectedLoanId) {

  return;

}


this.selectedLoan =
  this.loanList.find(

    loan =>
      Number(loan.id) ===
      Number(this.selectedLoanId)

  ) || null;


if (this.selectedLoan) {

  this.loadExistingSchedule();

}


}

// =========================================
// LOAD ALL LOANS
// =========================================

loadLoans(): void {


this.loanService.getAll().subscribe({

  next: (data) => {

    this.loanList = data || [];


    // If loanId came from parent
    if (this.selectedLoanId) {

      this.loadSelectedLoan();

    }

  },

  error: (error) => {

    console.error(
      'Loan API Error:',
      error
    );

    alert(
      'Failed to load loans'
    );

  }

});


}

// =========================================
// LOAD SELECTED LOAN
// =========================================

loadSelectedLoan(): void {


if (!this.selectedLoanId) {

  return;

}


this.selectedLoan =
  this.loanList.find(

    loan =>
      Number(loan.id) ===
      Number(this.selectedLoanId)

  ) || null;


if (this.selectedLoan) {

  this.loadExistingSchedule();

}


}

// =========================================
// LOAD EXISTING SCHEDULE
// =========================================

loadExistingSchedule(): void {


if (!this.selectedLoanId) {

  return;

}


this.loading = true;


this.clScheduleService
  .getByLoanId(this.selectedLoanId)
  .subscribe({

    next: (existing) => {

      this.scheduleList =
        existing || [];

      this.loading = false;

    },

    error: (error) => {

      console.error(
        'Get CL Schedule Error:',
        error
      );

      this.scheduleList = [];

      this.loading = false;

    }

  });


}

// =========================================
// GENERATE / LOAD CL SCHEDULE
// =========================================

generateSchedule(): void {


if (!this.selectedLoanId) {

  alert(
    'Please select Loan first'
  );

  return;

}


this.loading = true;


// First check existing schedule

this.clScheduleService
  .getByLoanId(this.selectedLoanId)
  .subscribe({

    next: (existing) => {

      // Existing schedule

      if (
        existing &&
        existing.length > 0
      ) {

        this.scheduleList =
          existing;

        this.loading = false;

        return;

      }


      // Generate new schedule

      this.clScheduleService
        .generateSchedule(
          this.selectedLoanId!
        )
        .subscribe({

          next: (data) => {

            this.scheduleList =
              data || [];

            this.loading = false;

          },

          error: (error) => {

            console.error(
              'Generate CL Schedule Error:',
              error
            );

            this.scheduleList = [];

            this.loading = false;

            alert(
              'Failed to generate CL Schedule'
            );

          }

        });

    },

    error: (error) => {

      console.error(
        'Get CL Schedule Error:',
        error
      );

      this.scheduleList = [];

      this.loading = false;

      alert(
        'Failed to load CL Schedule'
      );

    }

  });


}

// =========================================
// EXPORT TO EXCEL
// =========================================

exportToExcel(): void {


if (
  !this.scheduleList ||
  this.scheduleList.length === 0
) {

  alert(
    'No CL Schedule records available for export'
  );

  return;

}


const excelData =
  this.scheduleList.map(
    (schedule, index) => ({

      'Sr. No.':
        index + 1,

      'Installment No.':
        schedule.installmentNo || '',

      'Installment Date':
        schedule.installmentDate || '',

      'Outstanding Principal':
        Number(
          schedule.outstandingAmount || 0
        ),

      'Principal':
        Number(
          schedule.principalAmount || 0
        ),

      'Interest':
        Number(
          schedule.interestAmount || 0
        ),

      'Monthly Installment':
        Number(
          schedule.monthlyInstallment || 0
        ),

      'Average Installment':
        Number(
          schedule.averageMonthlyInstallment || 0
        ),

      'Closing Balance':
        Number(
          schedule.closingBalance || 0
        ),

      'Remark':
        schedule.remark || ''

    })
  );


// =========================================
// TOTALS
// =========================================

const totalPrincipal =
  this.scheduleList.reduce(
    (total, schedule) =>
      total +
      Number(
        schedule.principalAmount || 0
      ),
    0
  );


const totalInterest =
  this.scheduleList.reduce(
    (total, schedule) =>
      total +
      Number(
        schedule.interestAmount || 0
      ),
    0
  );


const totalMonthlyInstallment =
  this.scheduleList.reduce(
    (total, schedule) =>
      total +
      Number(
        schedule.monthlyInstallment || 0
      ),
    0
  );


const totalPayableAmount =
  totalPrincipal +
  totalInterest;


// =========================================
// WORKSHEET
// =========================================

const worksheet: XLSX.WorkSheet =
  XLSX.utils.json_to_sheet(
    excelData
  );


// =========================================
// SUMMARY
// =========================================

XLSX.utils.sheet_add_aoa(

  worksheet,

  [

    [],

    ['CL SCHEDULE SUMMARY'],

    [
      'Loan ID',
      this.selectedLoanId || ''
    ],

    [
      'Group Name',
      this.selectedLoan?.groupName || ''
    ],

    [
      'Woman Name',
      this.selectedLoan?.womanName || ''
    ],

    [
      'Loan Amount',
      Number(
        this.selectedLoan?.loanAmount || 0
      )
    ],

    [
      'Monthly EMI',
      Number(
        this.selectedLoan?.monthlyEmi || 0
      )
    ],

    [
      'Total Installments',
      this.scheduleList.length
    ],

    [
      'Total Principal',
      totalPrincipal
    ],

    [
      'Total Interest',
      totalInterest
    ],

    [
      'Total Monthly Installment',
      totalMonthlyInstallment
    ],

    [
      'Total Payable Amount',
      totalPayableAmount
    ]

  ],

  {
    origin:
      `A${excelData.length + 3}`
  }

);


// =========================================
// COLUMN WIDTH
// =========================================

worksheet['!cols'] = [

  { wch: 10 },

  { wch: 18 },

  { wch: 20 },

  { wch: 22 },

  { wch: 18 },

  { wch: 18 },

  { wch: 22 },

  { wch: 22 },

  { wch: 20 },

  { wch: 18 }

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


XLSX.writeFile(
  workbook,
  fileName
);


}

}
