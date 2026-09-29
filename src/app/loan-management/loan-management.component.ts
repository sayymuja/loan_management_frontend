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
  // SELECTED
  // =========================================================

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;

  // =========================================================
  // FORM
  // =========================================================

  showForm: boolean = false;

  newLoan: Loan = {
    voAlfId: 0
  };

  // =========================================================
  // SEARCH
  // =========================================================

  globalSearch: string = '';

  // =========================================================
  // LOAN DETAILS
  // =========================================================

  selectedLoanId: number | null = null;
  selectedLoan: Loan | null = null;

  // =========================================================
  // CL SCHEDULE
  // =========================================================

  showClSchedule: boolean = false;

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
  // CURRENT DATE
  // =========================================================

  getCurrentDate(): string {

    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        today.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // LOAD CMRC
  // =========================================================

  loadCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {
        this.cmrcList = data || [];
      },

      error: (error) => {

        console.error(
          'CMRC API Error:',
          error
        );

        this.cmrcList = [];
      }

    });
  }

  // =========================================================
  // LOAD VO / ALF
  // =========================================================

  loadVoAlfByCmrc(): void {

    this.voAlfList = [];
    this.loanList = [];

    this.selectedVoAlfId = null;

    this.cmrcBalance = 0;
    this.totalReceivedFund = 0;
    this.cmrcLeftAmount = 0;

    this.showForm = false;

    this.showClSchedule = false;
    this.selectedLoanId = null;
    this.selectedLoan = null;

    this.showRepayment = false;
    this.selectedRepaymentLoanId = null;
    this.selectedRepaymentLoan = null;

    if (!this.selectedCmrcId) {
      return;
    }

    // -------------------------------------------------------
    // VO / ALF
    // -------------------------------------------------------

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          this.totalReceivedFund =
            this.voAlfList.reduce(
              (total: number, voAlf: VoAlf) =>
                total +
                Number(
                  voAlf.receivedFund || 0
                ),
              0
            );

          this.calculateCmrcLeftAmount();

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

    // -------------------------------------------------------
    // CMRC BALANCE
    // -------------------------------------------------------

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

    this.showForm = false;

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

        next: (data: Loan[]) => {

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
        (c: Cmrc) =>
          c.id === this.selectedCmrcId
      );

    return cmrc?.cmrcName || '';
  }

  // =========================================================
  // SELECTED VO / ALF NAME
  // =========================================================

  getSelectedVoAlfName(): string {

    const voAlf =
      this.voAlfList.find(
        (v: VoAlf) =>
          v.id === this.selectedVoAlfId
      );

    return voAlf?.voAlfName || '';
  }

  // =========================================================
  // SELECTED VO / ALF FUND
  // =========================================================

  getSelectedVoAlfRecievedFund(): number {

    const voAlf =
      this.voAlfList.find(
        (v: VoAlf) =>
          v.id === this.selectedVoAlfId
      );

    return Number(
      voAlf?.receivedFund || 0
    );
  }

  // =========================================================
  // OPEN ADD LOAN FORM
  // =========================================================

  openAddForm(): void {

    if (!this.selectedVoAlfId) {

      alert(
        'Please select VO / ALF first'
      );

      return;
    }

    // Close other sections
    this.showClSchedule = false;

    this.selectedLoanId = null;
    this.selectedLoan = null;

    this.showRepayment = false;

    this.selectedRepaymentLoanId = null;
    this.selectedRepaymentLoan = null;

    // -------------------------------------------------------
    // NEW LOAN
    // -------------------------------------------------------

    this.newLoan = {

      voAlfId:
        this.selectedVoAlfId,

      groupName: '',

      womanName: '',

      // Main repayment amount
      loanAmount: 0,

      sanctionedAmount:
        undefined,

      processingFee:
        0,

      disbursedAmount:
        0,

      loanPurpose: '',

      loanGivenDate:
        this.getCurrentDate(),

      repaymentPeriodMonths:
        undefined,

      repaymentFrequency:
        'MONTHLY',

      interestRate:
        undefined,

      interestType:
        'FLAT',

      monthlyEmi:
        undefined,

      loanStatus:
        'ACTIVE'
    };

    this.showForm = true;

    setTimeout(() => {

      const element =
        document.getElementById(
          'loanFormSection'
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
  // CLOSE FORM
  // =========================================================

  closeForm(): void {

    this.showForm = false;

    this.newLoan = {

      voAlfId:
        this.selectedVoAlfId || 0,

      loanAmount:
        0,

      loanGivenDate:
        this.getCurrentDate()

    };
  }

  // =========================================================
  // SAVE LOAN
  // =========================================================

  saveLoan(): void {

    if (!this.selectedVoAlfId) {

      alert(
        'Please select VO / ALF first'
      );

      return;
    }

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (
      !this.newLoan.groupName ||
      !this.newLoan.groupName.trim()
    ) {

      alert(
        'Please enter Group Name'
      );

      return;
    }

    if (
      !this.newLoan.womanName ||
      !this.newLoan.womanName.trim()
    ) {

      alert(
        'Please enter Woman Name'
      );

      return;
    }

    if (
      !this.newLoan.sanctionedAmount ||
      this.newLoan.sanctionedAmount <= 0
    ) {

      alert(
        'Please enter valid Sanctioned Amount'
      );

      return;
    }

    if (
      this.newLoan.repaymentPeriodMonths ===
        undefined ||
      this.newLoan.repaymentPeriodMonths <= 0
    ) {

      alert(
        'Please enter Repayment Period'
      );

      return;
    }

    if (
      this.newLoan.interestRate === undefined ||
      this.newLoan.interestRate === null ||
      this.newLoan.interestRate < 0
    ) {

      alert(
        'Please enter valid Interest Rate'
      );

      return;
    }

    // -------------------------------------------------------
    // SET VO / ALF
    // -------------------------------------------------------

    this.newLoan.voAlfId =
      this.selectedVoAlfId;

    // -------------------------------------------------------
    // DATE
    // -------------------------------------------------------

    if (!this.newLoan.loanGivenDate) {

      this.newLoan.loanGivenDate =
        this.getCurrentDate();
    }

    // -------------------------------------------------------
    // CALCULATE DISBURSED AMOUNT
    // -------------------------------------------------------

    this.calculateDisbursedAmount();

    // =======================================================
    // IMPORTANT
    // =======================================================
    // Repayment ke liye loanAmount = Disbursed Amount
    // =======================================================

    this.newLoan.loanAmount =
      Number(
        this.newLoan.disbursedAmount || 0
      );

    console.log(
      'Sanctioned Amount:',
      this.newLoan.sanctionedAmount
    );

    console.log(
      'Processing Fee:',
      this.newLoan.processingFee
    );

    console.log(
      'Disbursed Amount:',
      this.newLoan.disbursedAmount
    );

    console.log(
      'Repayment Loan Amount:',
      this.newLoan.loanAmount
    );

    // -------------------------------------------------------
    // CALCULATE EMI
    // -------------------------------------------------------

    this.calculateEmi();

    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------

    this.loanService
      .create(this.newLoan)
      .subscribe({

        next: (data: Loan) => {

          console.log(
            'Created Loan:',
            data
          );

          alert(
            'Loan created successfully'
          );

          this.closeForm();

          this.loadLoans();

        },

        error: (error) => {

          console.error(
            'Create Loan Error:',
            error
          );

          alert(
            'Failed to create loan'
          );
        }

      });
  }

  // =========================================================
  // DISBURSED AMOUNT
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

      this.newLoan.loanAmount =
        0;

      return;
    }

    this.newLoan.disbursedAmount =
      Math.max(
        sanctionedAmount -
        processingFee,
        0
      );

    // IMPORTANT:
    // loanAmount always follows disbursedAmount

    this.newLoan.loanAmount =
      Number(
        this.newLoan.disbursedAmount || 0
      );
  }

  // =========================================================
  // EMI CALCULATION
  // =========================================================

  calculateEmi(): void {

    // IMPORTANT:
    // EMI / repayment is based on loanAmount
    // which is Disbursed Amount

    const principal =
      Number(
        this.newLoan.loanAmount || 0
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

    if (monthlyRate === 0) {

      this.newLoan.monthlyEmi =
        principal /
        months;

      return;
    }

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
  // CLOSE LOAN DETAILS
  // =========================================================

  closeLoanDetails(): void {

    this.selectedLoanId = null;
    this.selectedLoan = null;
  }

  // =========================================================
  // OPEN LOAN DETAILS
  // =========================================================

  openLoanDetails(loan: Loan): void {

    if (!loan || !loan.id) {

      alert(
        'Loan ID not found'
      );

      return;
    }

    this.showForm = false;

    this.showClSchedule = false;

    this.showRepayment = false;

    this.selectedLoanId =
      loan.id;

    this.selectedLoan = {
      ...loan
    };

    this.selectedRepaymentLoanId =
      null;

    this.selectedRepaymentLoan =
      null;

    setTimeout(() => {

      const element =
        document.getElementById(
          'loanDetailsSection'
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
  // OPEN CL SCHEDULE
  // =========================================================

  openClSchedule(loan: Loan): void {

    if (!loan.id) {

      alert(
        'Loan ID not found'
      );

      return;
    }

    this.showForm = false;

    this.showRepayment = false;

    this.selectedRepaymentLoanId =
      null;

    this.selectedRepaymentLoan =
      null;

    this.selectedLoanId =
      loan.id;

    this.selectedLoan = {
      ...loan
    };

    this.showClSchedule = false;

    setTimeout(() => {

      this.showClSchedule = true;

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

      }, 50);

    }, 0);
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

  openRepayment(loan: Loan): void {

    if (!loan.id) {

      alert(
        'Loan ID not found'
      );

      return;
    }

    this.showForm = false;

    this.showClSchedule = false;

    this.selectedLoanId = null;
    this.selectedLoan = null;

    this.showRepayment = false;

    this.selectedRepaymentLoanId =
      loan.id;

    this.selectedRepaymentLoan = {
      ...loan
    };

    setTimeout(() => {

      this.showRepayment = true;

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

      }, 50);

    }, 0);
  }

 

  // =========================================================
  // DELETE
  // =========================================================

  deleteLoan(id: number): void {

    if (
      !confirm(
        'Are you sure you want to delete this loan?'
      )
    ) {

      return;
    }

    this.loanService
      .delete(id)
      .subscribe({

        next: () => {

          alert(
            'Loan deleted successfully.'
          );

          this.loadLoans();
        },

        error: (error) => {

          console.error(
            'Delete loan error:',
            error
          );

          this.loadLoans();
        }

      });
  }

  // =========================================================
  // FILTER
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
      (loan: Loan) =>

        (loan.groupName || '')
          .toLowerCase()
          .includes(search)

        ||

        (loan.womanName || '')
          .toLowerCase()
          .includes(search)

        ||

        (loan.loanPurpose || '')
          .toLowerCase()
          .includes(search)

        ||

        String(
          loan.loanAmount || ''
        ).includes(search)

        ||

        String(
          loan.sanctionedAmount || ''
        ).includes(search)

        ||

        String(
          loan.processingFee || ''
        ).includes(search)

        ||

        String(
          loan.disbursedAmount || ''
        ).includes(search)

        ||

        String(
          loan.monthlyEmi || ''
        ).includes(search)

        ||

        String(
          loan.repaymentPeriodMonths || ''
        ).includes(search)

        ||

        String(
          loan.interestRate || ''
        ).includes(search)

        ||

        (loan.loanStatus || '')
          .toLowerCase()
          .includes(search)
    );
  }

  // =========================================================
  // TOTAL SANCTIONED
  // =========================================================

  getTotalSanctionedAmount(): number {

    return this.filteredLoanList.reduce(

      (total: number, loan: Loan) =>

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

      (total: number, loan: Loan) =>

        total +
        Number(
          loan.processingFee || 0
        ),

      0
    );
  }

  // =========================================================
  // TOTAL DISBURSED
  // =========================================================

  getTotalDisbursedAmount(): number {

    return this.filteredLoanList.reduce(

      (total: number, loan: Loan) =>

        total +
        Number(
          loan.disbursedAmount || 0
        ),

      0
    );
  }

  // =========================================================
  // TOTAL EMI
  // =========================================================

  getTotalMonthlyEmi(): number {

    return this.filteredLoanList.reduce(

      (total: number, loan: Loan) =>

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

      (total: number, loan: Loan) => {

        const principal =
          Number(
            loan.loanAmount || 0
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
  // TOTAL PAYABLE
  // =========================================================

  getTotalPayableAmount(): number {

    return (
      this.getTotalDisbursedAmount() +
      this.getTotalInterest()
    );
  }

  // =========================================================
  // REMAINING VO / ALF FUND
  // =========================================================

  getRemainingAmount(): number {

    const receivedFund =
      this.getSelectedVoAlfRecievedFund();

    const totalDisbursedAmount =
      this.getTotalDisbursedAmount();

    return (
      receivedFund -
      totalDisbursedAmount
    );
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
  // EXPORT EXCEL
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

    const excelData =
      this.filteredLoanList.map(
        (loan: Loan, index: number) => ({

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

          'Loan Amount':
            Number(
              loan.loanAmount || 0
            ),

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

          'Repayment Frequency':
            loan.repaymentFrequency || '',

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

    const worksheet:
      XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

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
          'Total Loan Amount',
          this.filteredLoanList.reduce(
            (total, loan) =>
              total +
              Number(
                loan.loanAmount || 0
              ),
            0
          )
        ],

        [
          'Total Sanctioned Amount',
          this.getTotalSanctionedAmount()
        ],

        [
          'Total Processing Fee',
          this.getTotalProcessingFee()
        ],

        [
          'Total Disbursed Amount',
          this.getTotalDisbursedAmount()
        ],

        [
          'Total Monthly EMI',
          this.getTotalMonthlyEmi()
        ],

        [
          'Total Interest',
          this.getTotalInterest()
        ],

        [
          'Total Payable Amount',
          this.getTotalPayableAmount()
        ]

      ],

      {
        origin:
          `A${excelData.length + 3}`
      }

    );

    worksheet['!cols'] = [

      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 25 },
      { wch: 18 },
      { wch: 24 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 }

    ];

    const workbook:
      XLSX.WorkBook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Loan Details'
    );

    const safeCmrcName =
      cmrcName.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      );

    const safeVoAlfName =
      voAlfName.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      );

    const fileName =
      `${safeCmrcName}_${safeVoAlfName}_Loan_Report.xlsx`;

    XLSX.writeFile(
      workbook,
      fileName
    );
  }
  closeRepayment(): void {
  this.showRepayment = false;
  this.selectedRepaymentLoanId = null;
  this.selectedRepaymentLoan = null;
}
getTotalLoanAmount(): number {
  return this.filteredLoanList.reduce(
    (total, loan) => total + Number(loan.loanAmount || 0),
    0
  );
}
}