import { Component, OnInit } from '@angular/core';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { LoanService, Loan } from '../services/loan.service';

import {
  CmrcBalance,
  CmrcBalanceService
} from '../services/cmrc-balance.service';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-loan-management',
  templateUrl: './loan-management.component.html',
  styleUrls: ['./loan-management.component.css']
})
export class LoanManagementComponent implements OnInit {

  // =========================================================
  // LIST DATA
  // =========================================================

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  loanList: Loan[] = [];

  // =========================================================
  // CMRC BALANCE
  // =========================================================

  cmrcBalance: number = 0;
  totalReceivedFund: number = 0;
  cmrcLeftAmount: number = 0;

  // =========================================================
  // SELECTED IDS
  // =========================================================

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;

  // =========================================================
  // FORM
  // =========================================================

  showForm: boolean = false;
  isEditMode: boolean = false;

  newLoan: Loan = {
    voAlfId: 0
  };

  // =========================================================
  // SEARCH
  // =========================================================

  globalSearch: string = '';

  // =========================================================
  // CL SCHEDULE
  // =========================================================

  showClSchedule: boolean = false;

  selectedLoanId: number | null = null;
  selectedLoan: Loan | null = null;

  // =========================================================
  // REPAYMENT
  // =========================================================

  showRepayment: boolean = false;

selectedRepaymentLoanId: number | null = null;
selectedRepaymentLoan: Loan | null = null;

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService,
    private cmrcBalanceService: CmrcBalanceService
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadCmrc();
  }

  // =========================================================
  // LOAD CMRC
  // =========================================================

  loadCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data) => {
        this.cmrcList = data || [];
      },

      error: (error) => {
        console.error('CMRC API Error:', error);
        this.cmrcList = [];
      }

    });
  }

  // =========================================================
  // LOAD VO / ALF BY CMRC
  // =========================================================

  loadVoAlfByCmrc(): void {

    this.voAlfList = [];
    this.loanList = [];

    this.selectedVoAlfId = null;

    this.cmrcBalance = 0;
    this.totalReceivedFund = 0;
    this.cmrcLeftAmount = 0;

    this.showClSchedule = false;
    this.selectedLoanId = null;
    this.selectedLoan = null;

    this.showRepayment = false;
    this.selectedRepaymentLoanId = null;
    this.selectedRepaymentLoan = null;

    if (!this.selectedCmrcId) {
      return;
    }

    // ---------------------------------------------------------
    // LOAD VO / ALF
    // ---------------------------------------------------------

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data) => {

          this.voAlfList = data || [];

          this.totalReceivedFund =
            this.voAlfList.reduce(
              (total, voAlf) =>
                total + Number(voAlf.receivedFund || 0),
              0
            );

          this.calculateCmrcLeftAmount();

          console.log(
            'Total VO / ALF Received Fund:',
            this.totalReceivedFund
          );
        },

        error: (error) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.voAlfList = [];
          this.totalReceivedFund = 0;

          this.calculateCmrcLeftAmount();
        }

      });

    // ---------------------------------------------------------
    // LOAD CMRC BALANCE
    // ---------------------------------------------------------

    this.cmrcBalanceService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: CmrcBalance[]) => {

          if (data && data.length > 0) {

            const latestBalance =
              data[data.length - 1];

            this.cmrcBalance =
              Number(
                latestBalance.balanceAmount || 0
              );

          } else {

            this.cmrcBalance = 0;
          }

          this.calculateCmrcLeftAmount();

          console.log(
            'CMRC Balance:',
            this.cmrcBalance
          );
        },

        error: (error) => {

          console.error(
            'CMRC Balance API Error:',
            error
          );

          this.cmrcBalance = 0;

          this.calculateCmrcLeftAmount();
        }

      });
  }

  // =========================================================
  // CMRC LEFT AMOUNT
  // =========================================================

  calculateCmrcLeftAmount(): void {

    this.cmrcLeftAmount =
      this.cmrcBalance -
      this.totalReceivedFund;
  }

  // =========================================================
  // LOAD LOANS
  // =========================================================

  loadLoans(): void {

    this.loanList = [];
    this.globalSearch = '';

    this.showClSchedule = false;
    this.selectedLoanId = null;
    this.selectedLoan = null;

    this.showRepayment = false;
    this.selectedRepaymentLoanId = null;
    this.selectedRepaymentLoan = null;

    if (!this.selectedVoAlfId) {
      return;
    }

    this.loanService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({

        next: (data) => {

          this.loanList = data || [];

          console.log(
            'Loan Data:',
            this.loanList
          );
        },

        error: (error) => {

          console.error(
            'Loan API Error:',
            error
          );

          this.loanList = [];
        }

      });
  }

  // =========================================================
  // SELECTED CMRC NAME
  // =========================================================

  getSelectedCmrcName(): string {

    const cmrc =
      this.cmrcList.find(
        c => c.id === this.selectedCmrcId
      );

    return cmrc?.cmrcName || '';
  }

  // =========================================================
  // SELECTED VO / ALF NAME
  // =========================================================

  getSelectedVoAlfName(): string {

    const voAlf =
      this.voAlfList.find(
        v => v.id === this.selectedVoAlfId
      );

    return voAlf?.voAlfName || '';
  }

  // =========================================================
  // SELECTED VO / ALF RECEIVED FUND
  // =========================================================

  getSelectedVoAlfRecievedFund(): number {

    const voAlf =
      this.voAlfList.find(
        v => v.id === this.selectedVoAlfId
      );

    return Number(
      voAlf?.receivedFund || 0
    );
  }

  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  openAddForm(): void {

    if (!this.selectedVoAlfId) {

      alert(
        'Please select VO / ALF first'
      );

      return;
    }

    this.newLoan = {

      voAlfId:
        this.selectedVoAlfId,

      groupName: '',

      womanName: '',

      // -----------------------------------------------------
      // ACTUAL LOAN PRINCIPAL
      // -----------------------------------------------------

      sanctionedAmount:
        undefined,

      // -----------------------------------------------------
      // DEDUCTION
      // -----------------------------------------------------

      processingFee:
        0,

      // -----------------------------------------------------
      // AUTO CALCULATED
      // -----------------------------------------------------

      disbursedAmount:
        0,

      loanPurpose: '',

      loanGivenDate: '',

      repaymentPeriodMonths:
        undefined,

      interestRate:
        undefined,

      interestType:
        'FLAT',

      monthlyEmi:
        undefined
    };

    this.isEditMode = false;

    this.showForm = true;
  }

  // =========================================================
  // CLOSE FORM
  // =========================================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.newLoan = {

      voAlfId:
        this.selectedVoAlfId || 0
    };
  }

  // =========================================================
  // SAVE LOAN
  // =========================================================

 saveLoan(): void {

  if (!this.selectedVoAlfId) {
    alert('Please select VO / ALF first');
    return;
  }

  this.newLoan.voAlfId = this.selectedVoAlfId;

  // 1. Calculate Disbursed Amount
  this.calculateDisbursedAmount();

  // 2. Calculate EMI on Sanctioned Amount
  this.calculateEmi();

  // 3. OLD loanAmount = Disbursed Amount
  this.newLoan.loanAmount =
    Number(this.newLoan.disbursedAmount || 0);

  // =====================================================
  // UPDATE EXISTING LOAN
  // =====================================================

  if (this.isEditMode && this.newLoan.id) {

    this.loanService
      .update(
        this.newLoan.id,
        this.newLoan
      )
      .subscribe({

        next: () => {

          alert('Loan updated successfully');

          this.closeForm();

          this.loadLoans();
        },

        error: (error) => {

          console.error(
            'Update Loan Error:',
            error
          );

          alert('Failed to update loan');
        }

      });

    return;
  }

  // =====================================================
  // CREATE NEW LOAN
  // =====================================================

  this.loanService
    .create(this.newLoan)
    .subscribe({

      next: () => {

        alert('Loan created successfully');

        this.closeForm();

        this.loadLoans();
      },

      error: (error) => {

        console.error(
          'Create Loan Error:',
          error
        );

        alert('Failed to create loan');
      }

    });
}

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  openEditForm(loan: Loan): void {

    this.newLoan = {
      ...loan
    };

    this.isEditMode = true;

    this.showForm = true;

    // Recalculate values
    this.calculateDisbursedAmount();

    this.calculateEmi();
  }

  // =========================================================
  // DELETE LOAN
  // =========================================================

  deleteLoan(id: number): void {

    if (
      !confirm(
        'Are you sure you want to delete this loan record?'
      )
    ) {
      return;
    }

    this.loanService
      .delete(id)
      .subscribe({

        next: () => {

          alert(
            'Loan deleted successfully'
          );

          this.loadLoans();
        },

        error: (error) => {

          console.error(
            'Delete Loan Error:',
            error
          );

          alert(
            'Failed to delete loan'
          );
        }

      });
  }

  // =========================================================
  // CALCULATE DISBURSED AMOUNT
  // =========================================================
  //
  // BUSINESS RULE:
  //
  // Sanctioned Amount = Actual Loan Principal
  //
  // Processing Fee = Deduction
  //
  // Disbursed Amount =
  // Sanctioned Amount - Processing Fee
  //
  // Example:
  //
  // Sanctioned = 450000
  // Processing Fee = 2250
  // Disbursed = 447750
  //
  // =========================================================

  calculateDisbursedAmount(): void {

    const sanctionedAmount =
      Number(
        this.newLoan.sanctionedAmount || 0
      );

    const processingFee =
      Number(
        this.newLoan.processingFee || 0
      );

    if (sanctionedAmount <= 0) {

      this.newLoan.disbursedAmount =
        0;

      return;
    }

    this.newLoan.disbursedAmount =
      Math.max(
        sanctionedAmount -
        processingFee,
        0
      );
  }

  // =========================================================
  // CALCULATE EMI
  // =========================================================
  //
  // IMPORTANT:
  //
  // EMI is calculated on SANCTIONED AMOUNT.
  //
  // NOT on DISBURSED AMOUNT.
  //
  // =========================================================

  calculateEmi(): void {

    const principal =
      Number(
        this.newLoan.sanctionedAmount || 0
      );

    const annualRate =
      Number(
        this.newLoan.interestRate || 0
      );

    const months =
      Number(
        this.newLoan.repaymentPeriodMonths || 0
      );

    const type =
      this.newLoan.interestType;

    // -------------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------------

    if (
      principal <= 0 ||
      months <= 0 ||
      !type
    ) {

      this.newLoan.monthlyEmi =
        undefined;

      return;
    }

    // =======================================================
    // FLAT INTEREST
    // =======================================================

    if (type === 'FLAT') {

      const totalInterest =
        principal *
        annualRate /
        100 *
        months /
        12;

      this.newLoan.monthlyEmi =
        (
          principal +
          totalInterest
        ) /
        months;

      return;
    }

    // =======================================================
    // REDUCING BALANCE
    // =======================================================

    const monthlyRate =
      annualRate /
      12 /
      100;

    // -------------------------------------------------------
    // ZERO INTEREST
    // -------------------------------------------------------

    if (monthlyRate === 0) {

      this.newLoan.monthlyEmi =
        principal /
        months;

      return;
    }

    // -------------------------------------------------------
    // EMI FORMULA
    // -------------------------------------------------------

    const factor =
      Math.pow(
        1 + monthlyRate,
        months
      );

    this.newLoan.monthlyEmi =
      principal *
      monthlyRate *
      factor /
      (factor - 1);
  }

  // =========================================================
  // NUMBER TO WORDS
  // =========================================================

  numberToWords(amount: number): string {

    if (!amount || amount <= 0) {
      return '';
    }

    const ones = [

      '',

      'One',

      'Two',

      'Three',

      'Four',

      'Five',

      'Six',

      'Seven',

      'Eight',

      'Nine',

      'Ten',

      'Eleven',

      'Twelve',

      'Thirteen',

      'Fourteen',

      'Fifteen',

      'Sixteen',

      'Seventeen',

      'Eighteen',

      'Nineteen'
    ];

    const tens = [

      '',

      '',

      'Twenty',

      'Thirty',

      'Forty',

      'Fifty',

      'Sixty',

      'Seventy',

      'Eighty',

      'Ninety'
    ];

    const convertBelowThousand =
      (num: number): string => {

        let result = '';

        if (num >= 100) {

          result +=
            ones[
              Math.floor(num / 100)
            ] +
            ' Hundred ';

          num %= 100;
        }

        if (num >= 20) {

          result +=
            tens[
              Math.floor(num / 10)
            ] +
            ' ';

          num %= 10;
        }

        if (num > 0) {

          result +=
            ones[num] +
            ' ';
        }

        return result.trim();
      };

    let result = '';

    const lakhs =
      Math.floor(
        amount / 100000
      );

    amount %= 100000;

    const thousands =
      Math.floor(
        amount / 1000
      );

    amount %= 1000;

    if (lakhs > 0) {

      result +=
        convertBelowThousand(
          lakhs
        ) +
        ' Lakh ';
    }

    if (thousands > 0) {

      result +=
        convertBelowThousand(
          thousands
        ) +
        ' Thousand ';
    }

    if (amount > 0) {

      result +=
        convertBelowThousand(
          amount
        );
    }

    return (
      result.trim() +
      ' Rupees Only'
    );
  }

  // =========================================================
  // FILTERED LOAN LIST
  // =========================================================

  get filteredLoanList(): Loan[] {

    const search =
      this.globalSearch
        .toLowerCase()
        .trim();

    if (!search) {

      return this.loanList;
    }

    return this.loanList.filter(
      loan =>

        // Group
        (loan.groupName || '')
          .toLowerCase()
          .includes(search)

        ||

        // Woman
        (loan.womanName || '')
          .toLowerCase()
          .includes(search)

        ||

        // Purpose
        (loan.loanPurpose || '')
          .toLowerCase()
          .includes(search)

        ||

        // Sanctioned Amount
        String(
          loan.sanctionedAmount || ''
        ).includes(search)

        ||

        // Processing Fee
        String(
          loan.processingFee || ''
        ).includes(search)

        ||

        // Disbursed Amount
        String(
          loan.disbursedAmount || ''
        ).includes(search)

        ||

        // EMI
        String(
          loan.monthlyEmi || ''
        ).includes(search)

        ||

        // Repayment Period
        String(
          loan.repaymentPeriodMonths || ''
        ).includes(search)

        ||

        // Interest
        String(
          loan.interestRate || ''
        ).includes(search)

        ||

        // Status
        (loan.loanStatus || '')
          .toLowerCase()
          .includes(search)
    );
  }

  // =========================================================
  // TOTAL SANCTIONED AMOUNT
  // =========================================================

  getTotalSanctionedAmount(): number {

    return this.filteredLoanList.reduce(

      (total, loan) =>

        total +
        Number(
          loan.sanctionedAmount || 0
        ),

      0
    );
  }

  // =========================================================
  // TOTAL PROCESSING FEE
  // =========================================================

  getTotalProcessingFee(): number {

    return this.filteredLoanList.reduce(

      (total, loan) =>

        total +
        Number(
          loan.processingFee || 0
        ),

      0
    );
  }

  // =========================================================
  // TOTAL DISBURSED AMOUNT
  // =========================================================

  getTotalDisbursedAmount(): number {

    return this.filteredLoanList.reduce(

      (total, loan) =>

        total +
        Number(
          loan.disbursedAmount || 0
        ),

      0
    );
  }

  // =========================================================
  // TOTAL MONTHLY EMI
  // =========================================================

  getTotalMonthlyEmi(): number {

    return this.filteredLoanList.reduce(

      (total, loan) =>

        total +
        Number(
          loan.monthlyEmi || 0
        ),

      0
    );
  }

  // =========================================================
  // TOTAL INTEREST
  // =========================================================

  getTotalInterest(): number {

    return this.filteredLoanList.reduce(

      (total, loan) => {

        const principal =
          Number(
            loan.sanctionedAmount || 0
          );

        const emi =
          Number(
            loan.monthlyEmi || 0
          );

        const months =
          Number(
            loan.repaymentPeriodMonths || 0
          );

        const totalPayable =
          emi * months;

        const interest =
          totalPayable -
          principal;

        return (
          total +
          Math.max(
            interest,
            0
          )
        );
      },

      0
    );
  }

  // =========================================================
  // TOTAL PAYABLE AMOUNT
  // =========================================================

  getTotalPayableAmount(): number {

    return (

      this.getTotalSanctionedAmount() +

      this.getTotalInterest()

    );
  }

  // =========================================================
  // REMAINING VO / ALF FUND
  // =========================================================

  getRemainingAmount(): number {

    const receivedFund =
      this.getSelectedVoAlfRecievedFund();

    const totalSanctionedAmount =
      this.getTotalSanctionedAmount();

    return (
      receivedFund -
      totalSanctionedAmount
    );
  }

  // =========================================================
  // OPEN CL SCHEDULE
  // =========================================================

  openClSchedule(loan: Loan): void {

    if (!loan.id) {

      alert(
        'Loan ID not found'
      );

      return;
    }

    // Close repayment
    this.showRepayment = false;

    this.selectedRepaymentLoanId =
      null;

    this.selectedRepaymentLoan =
      null;

    // Open CL Schedule
    this.selectedLoanId =
      loan.id;

    this.selectedLoan =
      loan;

    this.showClSchedule =
      true;

    // Scroll
    setTimeout(() => {

      const element =
        document.getElementById(
          'clScheduleSection'
        );

      if (element) {

        element.scrollIntoView({

          behavior: 'smooth',

          block: 'start'

        });
      }

    }, 100);
  }

  // =========================================================
  // CLOSE CL SCHEDULE
  // =========================================================

  closeClSchedule(): void {

    this.showClSchedule = false;

    this.selectedLoanId = null;

    this.selectedLoan = null;
  }

  // =========================================================
  // OPEN REPAYMENT
  // =========================================================
// =========================================================
// OPEN REPAYMENT
// =========================================================

openRepayment(loan: Loan): void {

  // -------------------------------------------------------
  // Validate Loan ID
  // -------------------------------------------------------

  if (!loan.id) {

    alert('Loan ID not found');

    return;
  }

  // -------------------------------------------------------
  // Close CL Schedule
  // -------------------------------------------------------

  this.showClSchedule = false;

  this.selectedLoanId = null;
  this.selectedLoan = null;

  // -------------------------------------------------------
  // PASS SELECTED LOAN
  // -------------------------------------------------------

  this.selectedRepaymentLoanId = loan.id;

  this.selectedRepaymentLoan = {
    ...loan
  };

  // -------------------------------------------------------
  // Open Repayment
  // -------------------------------------------------------

  this.showRepayment = true;

  // -------------------------------------------------------
  // Scroll to Repayment
  // -------------------------------------------------------

  setTimeout(() => {

    const element =
      document.getElementById(
        'repaymentSection'
      );

    if (element) {

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }

  }, 100);
}
  // =========================================================
  // CLOSE REPAYMENT
  // =========================================================

  closeRepayment(): void {

    this.showRepayment = false;

    this.selectedRepaymentLoanId =
      null;

    this.selectedRepaymentLoan =
      null;
  }

  // =========================================================
  // EXPORT TO EXCEL
  // =========================================================

  exportToExcel(): void {

    if (!this.selectedVoAlfId) {

      alert(
        'Please select VO / ALF first'
      );

      return;
    }

    if (
      !this.filteredLoanList ||
      this.filteredLoanList.length === 0
    ) {

      alert(
        'No loan records available for export'
      );

      return;
    }

    const cmrcName =
      this.getSelectedCmrcName();

    const voAlfName =
      this.getSelectedVoAlfName();

    // =======================================================
    // EXCEL DETAIL DATA
    // =======================================================

    const excelData =
      this.filteredLoanList.map(
        (loan, index) => ({

          'Sr. No.':
            index + 1,

          'CMRC Name':
            cmrcName,

          'VO / ALF Name':
            voAlfName,

          'Group Name':
            loan.groupName || '',

          'Woman Name':
            loan.womanName || '',

          'Sanctioned Amount':
            Number(
              loan.sanctionedAmount || 0
            ),

          'Processing Fee':
            Number(
              loan.processingFee || 0
            ),

          'Disbursed Amount':
            Number(
              loan.disbursedAmount || 0
            ),

          'Loan Purpose':
            loan.loanPurpose || '',

          'Loan Given Date':
            loan.loanGivenDate || '',

          'Repayment Period (Months)':
            Number(
              loan.repaymentPeriodMonths || 0
            ),

          'Interest Rate (%)':
            Number(
              loan.interestRate || 0
            ),

          'Interest Type':
            loan.interestType || '',

          'Monthly EMI':
            Number(
              loan.monthlyEmi || 0
            ),

          'Loan Status':
            loan.loanStatus || ''
        })
      );

    // =======================================================
    // TOTALS
    // =======================================================

    const totalSanctionedAmount =
      this.getTotalSanctionedAmount();

    const totalProcessingFee =
      this.getTotalProcessingFee();

    const totalDisbursedAmount =
      this.getTotalDisbursedAmount();

    const totalMonthlyEmi =
      this.getTotalMonthlyEmi();

    const totalInterest =
      this.getTotalInterest();

    const totalPayableAmount =
      this.getTotalPayableAmount();

    // =======================================================
    // CREATE WORKSHEET
    // =======================================================

    const worksheet:
      XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    // =======================================================
    // ADD SUMMARY
    // =======================================================

    XLSX.utils.sheet_add_aoa(

      worksheet,

      [

        [],

        ['LOAN SUMMARY'],

        [
          'CMRC Name',
          cmrcName
        ],

        [
          'VO / ALF Name',
          voAlfName
        ],

        [
          'Total Loans',
          this.filteredLoanList.length
        ],

        [
          'Total Sanctioned Amount',
          totalSanctionedAmount
        ],

        [
          'Total Processing Fee',
          totalProcessingFee
        ],

        [
          'Total Disbursed Amount',
          totalDisbursedAmount
        ],

        [
          'Total Monthly EMI',
          totalMonthlyEmi
        ],

        [
          'Total Interest',
          totalInterest
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

    // =======================================================
    // COLUMN WIDTH
    // =======================================================

    worksheet['!cols'] = [

      { wch: 10 },

      { wch: 20 },

      { wch: 20 },

      { wch: 18 },

      { wch: 22 },

      { wch: 20 },

      { wch: 18 },

      { wch: 20 },

      { wch: 25 },

      { wch: 18 },

      { wch: 24 },

      { wch: 18 },

      { wch: 18 },

      { wch: 18 },

      { wch: 15 }

    ];

    // =======================================================
    // CREATE WORKBOOK
    // =======================================================

    const workbook:
      XLSX.WorkBook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

      workbook,

      worksheet,

      'Loan Details'

    );

    // =======================================================
    // FILE NAME
    // =======================================================

    const fileName =
      `${cmrcName}_${voAlfName}_Loan_Report.xlsx`;

    // =======================================================
    // DOWNLOAD
    // =======================================================

    XLSX.writeFile(

      workbook,

      fileName

    );
  }
}