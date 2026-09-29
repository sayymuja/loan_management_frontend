import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { LoanService, Loan } from '../services/loan.service';
import { RepaymentService, Repayment } from '../services/repayment.service';
import { CmrcBalanceService } from '../services/cmrc-balance.service';


/* ============================================================
   REPORT INTERFACES
============================================================ */

interface FundsReceived {
  alfReceivedFund: number;
}

interface FundsDistributed {
  groupCount: number;
  womenCount: number;
  groupAmount: number;
  womenAmount: number;
}

interface FundsRepaid {
  groupCount: number;
  womenCount: number;
  groupAmount: number;
  womenAmount: number;
}

interface CurrentStatus {
  debtCycleWomen: number;
  totalInterestReceived: number;
}

interface ReportRecord {
  cmrcId: number | null;
  cmrcName: string;
  villageName: string;
  voAlfId: number | null;
  voAlfName: string;
  accountNo: string;

  fundsReceived: FundsReceived;
  fundsDistributed: FundsDistributed;
  fundsRepaid: FundsRepaid;
  currentStatus: CurrentStatus;
}


@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  /* ============================================================
     FILTERS
  ============================================================ */

  selectedYear: number | null = null;

  selectedCmrcId: number | null = null;

  searchText = '';


  /* ============================================================
     DROPDOWN DATA
  ============================================================ */

  availableYears: number[] = [
    2024,
    2025,
    2026
  ];

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  loanList: Loan[] = [];

  repaymentList: Repayment[] = [];


  /* ============================================================
     REPORT DATA
  ============================================================ */

  reportRecords: ReportRecord[] = [];

  filteredReportRecords: ReportRecord[] = [];


  /* ============================================================
     LOADING
  ============================================================ */

  loading = false;


  /* ============================================================
     CONSTRUCTOR
  ============================================================ */

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService,
    private repaymentService: RepaymentService,
    private cmrcBalanceService: CmrcBalanceService
  ) {}


  /* ============================================================
     INIT
  ============================================================ */

  ngOnInit(): void {

    this.loadCmrcList();

    this.loadReportData();

  }


  /* ============================================================
     LOAD CMRC
  ============================================================ */

  loadCmrcList(): void {

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


  /* ============================================================
     LOAD REPORT DATA
  ============================================================ */

  loadReportData(): void {

    this.loading = true;

    /*
     * Load required master/report data.
     *
     * We load VO / ALF first, then loans and repayments.
     */

    this.voAlfService.getAll().subscribe({

      next: (voAlfData: VoAlf[]) => {

        this.voAlfList = voAlfData || [];

        this.loadLoans();

      },

      error: (error) => {

        console.error(
          'VO / ALF API Error:',
          error
        );

        this.voAlfList = [];

        this.loadLoans();

      }

    });

  }


  /* ============================================================
     LOAD LOANS
  ============================================================ */

  loadLoans(): void {

    this.loanService.getAll().subscribe({

      next: (data: Loan[]) => {

        this.loanList = data || [];

        this.loadRepayments();

      },

      error: (error) => {

        console.error(
          'Loan API Error:',
          error
        );

        this.loanList = [];

        this.loadRepayments();

      }

    });

  }


  /* ============================================================
     LOAD REPAYMENTS
  ============================================================ */

  loadRepayments(): void {

    this.repaymentService.getAll().subscribe({

      next: (data: Repayment[]) => {

        this.repaymentList = data || [];

        this.buildReport();

        this.loading = false;

      },

      error: (error) => {

        console.error(
          'Repayment API Error:',
          error
        );

        this.repaymentList = [];

        this.buildReport();

        this.loading = false;

      }

    });

  }


  /* ============================================================
     BUILD REPORT
  ============================================================ */

  buildReport(): void {

    const records: ReportRecord[] = [];


    /*
     * Create report row for every VO / ALF.
     */

    this.voAlfList.forEach((voAlf: any) => {

      const voAlfId = voAlf.id;

      const voLoans = this.loanList.filter(
        loan => loan.voAlfId === voAlfId
      );


      /* --------------------------------------------------------
         FILTER BY FINANCIAL YEAR
      -------------------------------------------------------- */

      const yearLoans = voLoans.filter(
        loan => this.isInSelectedFinancialYear(
          loan.loanGivenDate
        )
      );


      /* --------------------------------------------------------
         FUNDS DISTRIBUTED
      -------------------------------------------------------- */

      const womenSet = new Set<string>();

      yearLoans.forEach(
        loan => {

          if (loan.womanName) {

            womenSet.add(
              loan.womanName.trim().toLowerCase()
            );

          }

        }
      );


      const groupSet = new Set<string>();

      yearLoans.forEach(
        loan => {

          if (loan.groupName) {

            groupSet.add(
              loan.groupName.trim().toLowerCase()
            );

          }

        }
      );


      const totalSanctionedAmount =
        yearLoans.reduce(
          (sum, loan) =>
            sum + Number(loan.loanAmount || 0),
          0
        );


      /*
       * Women Amount
       *
       * Based on the total sanctioned amount
       * of women-linked loans.
       */

      const womenAmount =
        yearLoans.reduce(
          (sum, loan) =>
            sum + Number(loan.loanAmount || 0),
          0
        );


      /* --------------------------------------------------------
         FUNDS REPAID
         ONLY CLOSED LOANS
      -------------------------------------------------------- */

      const closedLoans =
        yearLoans.filter(
          loan =>
            String(
              (loan as any).status || ''
            ).toUpperCase() === 'CLOSED'
        );


      const closedGroups = new Set<string>();

      const closedWomen = new Set<string>();


      closedLoans.forEach(
        loan => {

          if (loan.groupName) {

            closedGroups.add(
              loan.groupName.trim().toLowerCase()
            );

          }

          if (loan.womanName) {

            closedWomen.add(
              loan.womanName.trim().toLowerCase()
            );

          }

        }
      );


      const closedAmount =
        closedLoans.reduce(
          (sum, loan) =>
            sum + Number(loan.loanAmount || 0),
          0
        );


      /*
       * --------------------------------------------------------
       * ACTUAL REPAYMENT AMOUNT
       * --------------------------------------------------------
       */

      const loanIds = new Set(
        closedLoans.map(
          loan => loan.id
        )
      );


      const closedRepayments =
        this.repaymentList.filter(
          repayment =>
            loanIds.has(
              (repayment as any).loanId
            )
        );


      const actualRepaidAmount =
        closedRepayments.reduce(
          (sum, repayment: any) =>
            sum +
            Number(
              repayment.amount ||
              repayment.paidAmount ||
              repayment.paymentAmount ||
              0
            ),
          0
        );


      /* --------------------------------------------------------
         INTEREST RECEIVED
      -------------------------------------------------------- */

      const totalInterest =
        this.repaymentList
          .filter(
            repayment =>
              loanIds.has(
                (repayment as any).loanId
              )
          )
          .reduce(
            (sum, repayment: any) =>
              sum +
              Number(
                repayment.interestAmount ||
                repayment.interestPaid ||
                repayment.interest ||
                0
              ),
            0
          );


      /* --------------------------------------------------------
         DEBT CYCLE WOMEN
      -------------------------------------------------------- */

      /*
       * Current temporary rule:
       *
       * Women with repeated unpaid/bounced repayments.
       *
       * This checks repayment records for a loan.
       */

      const debtCycleWomen =
        this.calculateDebtCycleWomen(
          yearLoans
        );


      /* --------------------------------------------------------
         ALF RECEIVED FUND
      -------------------------------------------------------- */

      /*
       * This should come from your ALF fund/transaction
       * table/API.
       *
       * Until that API is connected, value is 0.
       */

      const alfReceivedFund = 0;


      /* --------------------------------------------------------
         ADD REPORT ROW
      -------------------------------------------------------- */

      records.push({

        cmrcId:
          voAlf.cmrcId || null,

        cmrcName:
          this.getCmrcName(
            voAlf.cmrcId
          ),

        villageName:
          voAlf.villageName ||
          voAlf.village ||
          '-',

        voAlfId:
          voAlfId,

        voAlfName:
          voAlf.name ||
          voAlf.voAlfName ||
          voAlf.voAlf ||
          '-',

        accountNo:
          voAlf.accountNo ||
          '-',

        fundsReceived: {

          alfReceivedFund:
            alfReceivedFund

        },

        fundsDistributed: {

          groupCount:
            groupSet.size,

          womenCount:
            womenSet.size,

          groupAmount:
            totalSanctionedAmount,

          womenAmount:
            womenAmount

        },

        fundsRepaid: {

          groupCount:
            closedGroups.size,

          womenCount:
            closedWomen.size,

          groupAmount:
            closedAmount,

          womenAmount:
            closedAmount

        },

        currentStatus: {

          debtCycleWomen:
            debtCycleWomen,

          totalInterestReceived:
            totalInterest

        }

      });

    });


    this.reportRecords = records;

    this.applyFilters();

  }


  /* ============================================================
     FINANCIAL YEAR CHECK
  ============================================================ */

  isInSelectedFinancialYear(
    date: any
  ): boolean {

    if (!date) {

      return true;

    }


    if (this.selectedYear === null) {

      return true;

    }


    const loanDate =
      new Date(date);

    const month =
      loanDate.getMonth() + 1;

    const year =
      loanDate.getFullYear();


    /*
     * Financial Year:
     *
     * April to March
     */

    if (month >= 4) {

      return year === this.selectedYear;

    }

    return year ===
      this.selectedYear + 1;

  }


  /* ============================================================
     DEBT CYCLE WOMEN
  ============================================================ */

  calculateDebtCycleWomen(
    loans: Loan[]
  ): number {

    const women = new Set<string>();


    loans.forEach(
      loan => {

        const loanId =
          loan.id;

        const repayments =
          this.repaymentList.filter(
            repayment =>
              (repayment as any).loanId === loanId
          );


        /*
         * If repayment records contain status,
         * look for repeated unpaid/bounced status.
         */

        const failedPayments =
          repayments.filter(
            (repayment: any) => {

              const status =
                String(
                  repayment.status || ''
                ).toUpperCase();

              return (
                status === 'BOUNCED' ||
                status === 'UNPAID' ||
                status === 'FAILED' ||
                status === 'OVERDUE'
              );

            }
          );


        /*
         * Current rule:
         * 2 or more failed repayments
         */

        if (
          failedPayments.length >= 2 &&
          loan.womanName
        ) {

          women.add(
            loan.womanName
              .trim()
              .toLowerCase()
          );

        }

      }
    );


    return women.size;

  }


  /* ============================================================
     GET CMRC NAME
  ============================================================ */

getCmrcName(cmrcId: number | null): string {
  if (!cmrcId) {
    return '-';
  }

  const cmrc = this.cmrcList.find(c => c.id === cmrcId);

  return cmrc?.cmrcName || '-';
}


   


  /* ============================================================
     YEAR CHANGE
  ============================================================ */

  onYearChange(): void {

    this.buildReport();

  }


  /* ============================================================
     CMRC CHANGE
  ============================================================ */

  onCmrcChange(): void {

    this.applyFilters();

  }


  /* ============================================================
     SEARCH / FILTER
  ============================================================ */

  applyFilters(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredReportRecords =
      this.reportRecords.filter(
        record => {

          /* CMRC filter */

          if (
            this.selectedCmrcId !== null &&
            record.cmrcId !==
              this.selectedCmrcId
          ) {

            return false;

          }


          /* Search filter */

          if (!search) {

            return true;

          }


          return (

            record.cmrcName
              .toLowerCase()
              .includes(search)

            ||

            record.villageName
              .toLowerCase()
              .includes(search)

            ||

            record.voAlfName
              .toLowerCase()
              .includes(search)

            ||

            record.accountNo
              .toLowerCase()
              .includes(search)

          );

        }
      );

  }


  /* ============================================================
     CLEAR FILTERS
  ============================================================ */

  clearFilters(): void {

    this.selectedYear = null;

    this.selectedCmrcId = null;

    this.searchText = '';

    this.buildReport();

  }


  /* ============================================================
     SUMMARY
  ============================================================ */

  getTotalAlfReceivedFund(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsReceived
            ?.alfReceivedFund || 0
        ),
      0
    );

  }


  getTotalDistributedGroupCount(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsDistributed
            ?.groupCount || 0
        ),
      0
    );

  }


  getTotalDistributedWomen(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsDistributed
            ?.womenCount || 0
        ),
      0
    );

  }


  getTotalDistributedGroupAmount(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsDistributed
            ?.groupAmount || 0
        ),
      0
    );

  }


  getTotalDistributedWomenAmount(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsDistributed
            ?.womenAmount || 0
        ),
      0
    );

  }


  getTotalRepaidGroupCount(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsRepaid
            ?.groupCount || 0
        ),
      0
    );

  }


  getTotalRepaidWomen(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsRepaid
            ?.womenCount || 0
        ),
      0
    );

  }


  getTotalRepaidGroupAmount(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsRepaid
            ?.groupAmount || 0
        ),
      0
    );

  }


  getTotalRepaidWomenAmount(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.fundsRepaid
            ?.womenAmount || 0
        ),
      0
    );

  }


  getTotalDebtCycleWomen(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.currentStatus
            ?.debtCycleWomen || 0
        ),
      0
    );

  }


  getTotalInterestReceived(): number {

    return this.filteredReportRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.currentStatus
            ?.totalInterestReceived || 0
        ),
      0
    );

  }


  /* ============================================================
     OLD SUMMARY METHODS
     ============================================================ */

  getTotalGroups(): number {

    return this.getTotalDistributedGroupCount();

  }


  getTotalWomen(): number {

    return this.getTotalDistributedWomen();

  }


  getTotalDistributedAmount(): number {

    return this.getTotalDistributedGroupAmount();

  }


  getTotalRepaidAmount(): number {

    return this.getTotalRepaidGroupAmount();

  }


  /* ============================================================
     GRAND TOTAL
  ============================================================ */

  getGrandTotal(): number {

    return this.getTotalInterestReceived();

  }


  /* ============================================================
     EXPORT TO EXCEL
  ============================================================ */

  exportToExcel(): void {

    if (
      !this.filteredReportRecords ||
      this.filteredReportRecords.length === 0
    ) {

      alert(
        'No report data available for export.'
      );

      return;

    }


    const excelData =
      this.filteredReportRecords.map(
        (record, index) => ({

          'Sr. No.':
            index + 1,

          'CMRC Name':
            record.cmrcName,

          'Village Name':
            record.villageName,

          'VO / ALF Name':
            record.voAlfName,

          'VO / ALF Account No.':
            record.accountNo,


          /* Funds Received */

          'ALF Received Fund':
            record.fundsReceived
              .alfReceivedFund,


          /* Funds Distributed */

          'Distributed - Group Count':
            record.fundsDistributed
              .groupCount,

          'Distributed - Number of Women':
            record.fundsDistributed
              .womenCount,

          'Distributed - Group Amount':
            record.fundsDistributed
              .groupAmount,

          'Distributed - Women Amount':
            record.fundsDistributed
              .womenAmount,


          /* Funds Repaid */

          'Repaid - Group Count':
            record.fundsRepaid
              .groupCount,

          'Repaid - Number of Women':
            record.fundsRepaid
              .womenCount,

          'Repaid - Group Amount':
            record.fundsRepaid
              .groupAmount,

          'Repaid - Women Amount':
            record.fundsRepaid
              .womenAmount,


          /* Current Status */

          'Women Trapped in Debt Cycle':
            record.currentStatus
              .debtCycleWomen,

          'Total Interest Received':
            record.currentStatus
              .totalInterestReceived

        })
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Fund Loan Report'
    );


    const yearText =
      this.selectedYear === null
        ? 'All-Years'
        : `${this.selectedYear}-${String(
            this.selectedYear + 1
          ).slice(-2)}`;


    XLSX.writeFile(
      workbook,
      `Fund-Loan-Report-${yearText}.xlsx`
    );

  }

}
