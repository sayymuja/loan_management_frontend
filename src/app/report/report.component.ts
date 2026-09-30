import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { GroupService, Group } from '../services/group.service';
import { WomenService, Women } from '../services/women.service';

import { LoanService, Loan } from '../services/loan.service';

import {
  RepaymentService,
  Repayment
} from '../services/repayment.service';

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


/* ============================================================
   COMPONENT
============================================================ */

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
     AVAILABLE YEARS
  ============================================================ */

  availableYears: number[] = [
    2024,
    2025,
    2026
  ];


  /* ============================================================
     MASTER DATA
  ============================================================ */

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  groupList: Group[] = [];

  womenList: Women[] = [];

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

    private groupService: GroupService,

    private womenService: WomenService,

    private loanService: LoanService,

    private repaymentService: RepaymentService,

    private cmrcBalanceService: CmrcBalanceService

  ) {}


  /* ============================================================
     INIT
  ============================================================ */

  ngOnInit(): void {

    this.loadAllReportData();

  }


  /* ============================================================
     LOAD ALL REPORT DATA
  ============================================================ */

  loadAllReportData(): void {

    this.loading = true;

    this.cmrcService.getAll().subscribe({

      next: (cmrcData: Cmrc[]) => {

        this.cmrcList = cmrcData || [];

        this.loadVoAlf();

      },

      error: (error: any) => {

        console.error(
          'CMRC API Error:',
          error
        );

        this.cmrcList = [];

        this.loadVoAlf();

      }

    });

  }


  /* ============================================================
     LOAD VO / ALF
  ============================================================ */

  loadVoAlf(): void {

    this.voAlfService.getAll().subscribe({

      next: (data: VoAlf[]) => {

        this.voAlfList = data || [];

        /*
         * Village is now stored directly
         * inside VO / ALF.
         *
         * No Village API required.
         */

        this.loadGroups();

      },

      error: (error: any) => {

        console.error(
          'VO / ALF API Error:',
          error
        );

        this.voAlfList = [];

        this.loadGroups();

      }

    });

  }


  /* ============================================================
     LOAD GROUPS
  ============================================================ */

  loadGroups(): void {

    this.groupService.getAll().subscribe({

      next: (data: Group[]) => {

        this.groupList = data || [];

        this.loadWomen();

      },

      error: (error: any) => {

        console.error(
          'Group API Error:',
          error
        );

        this.groupList = [];

        this.loadWomen();

      }

    });

  }


  /* ============================================================
     LOAD WOMEN
  ============================================================ */

  loadWomen(): void {

    this.womenService.getAll().subscribe({

      next: (data: Women[]) => {

        this.womenList = data || [];

        this.loadLoans();

      },

      error: (error: any) => {

        console.error(
          'Women API Error:',
          error
        );

        this.womenList = [];

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

      error: (error: any) => {

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

      error: (error: any) => {

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
     
     ONE ROW = ONE VO / ALF
     
     CMRC
       ↓
     VO / ALF
       ↓
     Village
       ↓
     Group
       ↓
     Women
       ↓
     Loan
       ↓
     Repayment
  ============================================================ */

  buildReport(): void {

    const records: ReportRecord[] = [];

    this.voAlfList.forEach(
      (voAlf: VoAlf) => {

        records.push(
          this.createReportRecord(voAlf)
        );

      }
    );

    this.reportRecords = records;

    this.applyFilters();

  }


  /* ============================================================
     CREATE REPORT RECORD
  ============================================================ */

  createReportRecord(
    voAlf: VoAlf
  ): ReportRecord {

    const voAlfId =
      voAlf.id || null;

    const cmrcId =
      voAlf.cmrcId || null;


    /* ==========================================================
       FIND GROUPS UNDER VO / ALF
    ========================================================== */

    const voAlfGroups =
      this.groupList.filter(
        (group: Group) =>
          group.voAlfId === voAlf.id
      );


    const groupIds =
      new Set<number>();


    voAlfGroups.forEach(
      (group: Group) => {

        if (group.id) {

          groupIds.add(
            group.id
          );

        }

      }
    );


    /* ==========================================================
       FIND WOMEN UNDER GROUPS
    ========================================================== */

    const voAlfWomen =
      this.womenList.filter(
        (woman: Women) =>
          woman.groupId !== undefined &&
          groupIds.has(
            woman.groupId
          )
      );


    const womanIds =
      new Set<number>();


    voAlfWomen.forEach(
      (woman: Women) => {

        if (woman.id) {

          womanIds.add(
            woman.id
          );

        }

      }
    );


    /* ==========================================================
       FIND LOANS
    ========================================================== */

    const voAlfLoans =
      this.loanList.filter(
        (loan: Loan) =>
          loan.womanId !== undefined &&
          womanIds.has(
            loan.womanId
          )
      );


    /* ==========================================================
       FINANCIAL YEAR FILTER
    ========================================================== */

    const yearLoans =
      voAlfLoans.filter(
        (loan: Loan) =>
          this.isInSelectedFinancialYear(
            loan.loanGivenDate
          )
      );


    /* ==========================================================
       UNIQUE GROUPS
    ========================================================== */

    const activeGroupSet =
      new Set<string>();


    yearLoans.forEach(
      (loan: Loan) => {

        if (loan.groupName) {

          activeGroupSet.add(
            loan.groupName
              .trim()
              .toLowerCase()
          );

        }

      }
    );


    /*
     * Fallback using actual group IDs.
     */

    if (
      activeGroupSet.size === 0
    ) {

      yearLoans.forEach(
        (loan: Loan) => {

          if (
            loan.womanId !== undefined
          ) {

            const woman =
              this.womenList.find(
                (w: Women) =>
                  w.id === loan.womanId
              );


            if (
              woman?.groupId !== undefined
            ) {

              activeGroupSet.add(
                String(
                  woman.groupId
                )
              );

            }

          }

        }
      );

    }


    /* ==========================================================
       UNIQUE WOMEN
    ========================================================== */

    const womenSet =
      new Set<number>();


    yearLoans.forEach(
      (loan: Loan) => {

        if (
          loan.womanId !== undefined
        ) {

          womenSet.add(
            loan.womanId
          );

        }

      }
    );


    /* ==========================================================
       DISTRIBUTED AMOUNT
    ========================================================== */

    const totalDistributedAmount =
      yearLoans.reduce(
        (
          sum: number,
          loan: Loan
        ) => {

          return sum +
            Number(
              loan.loanAmount || 0
            );

        },
        0
      );


    /* ==========================================================
       FIND REPAYMENTS
    ========================================================== */

    const loanIds =
      new Set<number>();


    yearLoans.forEach(
      (loan: Loan) => {

        if (loan.id) {

          loanIds.add(
            loan.id
          );

        }

      }
    );


    const voAlfRepayments =
      this.repaymentList.filter(
        (repayment: Repayment) => {

          const loanId =
            this.getRepaymentLoanId(
              repayment
            );

          return (
            loanId !== null &&
            loanIds.has(
              loanId
            )
          );

        }
      );


    /* ==========================================================
       PAID LOANS
    ========================================================== */

    const paidLoanIds =
      new Set<number>();


    voAlfRepayments.forEach(
      (repayment: Repayment) => {

        const loanId =
          this.getRepaymentLoanId(
            repayment
          );


        const status =
          String(
            (repayment as any)
              .paymentStatus || ''
          ).toUpperCase();


        const paidAmount =
          Number(
            (repayment as any)
              .paidAmount || 0
          );


        if (
          loanId !== null &&
          (
            status === 'PAID' ||
            paidAmount > 0
          )
        ) {

          paidLoanIds.add(
            loanId
          );

        }

      }
    );


    /* ==========================================================
       REPAID LOANS
    ========================================================== */

    const repaidLoans =
      yearLoans.filter(
        (loan: Loan) =>
          loan.id !== undefined &&
          paidLoanIds.has(
            loan.id
          )
      );


    /* ==========================================================
       REPAID GROUPS
    ========================================================== */

    const repaidGroupSet =
      new Set<string>();


    repaidLoans.forEach(
      (loan: Loan) => {

        if (loan.groupName) {

          repaidGroupSet.add(
            loan.groupName
              .trim()
              .toLowerCase()
          );

        }

      }
    );


    /*
     * Fallback using woman → group.
     */

    if (
      repaidGroupSet.size === 0
    ) {

      repaidLoans.forEach(
        (loan: Loan) => {

          const woman =
            this.womenList.find(
              (w: Women) =>
                w.id === loan.womanId
            );


          if (
            woman?.groupId !== undefined
          ) {

            repaidGroupSet.add(
              String(
                woman.groupId
              )
            );

          }

        }
      );

    }


    /* ==========================================================
       REPAID WOMEN
    ========================================================== */

    const repaidWomenSet =
      new Set<number>();


    repaidLoans.forEach(
      (loan: Loan) => {

        if (
          loan.womanId !== undefined
        ) {

          repaidWomenSet.add(
            loan.womanId
          );

        }

      }
    );


    /* ==========================================================
       ACTUAL REPAID AMOUNT
    ========================================================== */

    const actualRepaidAmount =
      voAlfRepayments.reduce(
        (
          sum: number,
          repayment: Repayment
        ) => {

          const status =
            String(
              (repayment as any)
                .paymentStatus || ''
            ).toUpperCase();


          const paidAmount =
            Number(
              (repayment as any)
                .paidAmount || 0
            );


          if (
            status === 'PAID' ||
            status === 'PARTIAL' ||
            paidAmount > 0
          ) {

            return sum +
              paidAmount;

          }

          return sum;

        },
        0
      );


    /* ==========================================================
       TOTAL INTEREST RECEIVED
    ========================================================== */

    const totalInterest =
      voAlfRepayments.reduce(
        (
          sum: number,
          repayment: Repayment
        ) => {

          return sum +
            Number(
              (repayment as any)
                .interestAmount || 0
            );

        },
        0
      );


    /* ==========================================================
       DEBT CYCLE WOMEN
    ========================================================== */

    const debtCycleWomen =
      this.calculateDebtCycleWomen(
        yearLoans
      );


    /* ==========================================================
       ALF RECEIVED FUND
    ========================================================== */

    /*
     * Currently no separate ALF fund
     * transaction API is connected.
     */

    const alfReceivedFund = 0;


    /* ==========================================================
       CREATE REPORT ROW
    ========================================================== */

    return {

      cmrcId:
        cmrcId,

      cmrcName:
        this.getCmrcName(
          cmrcId
        ),

      /*
       * Village now comes directly
       * from VO / ALF.
       */

      villageName:
        voAlf.villageName ||
        '-',

      voAlfId:
        voAlfId,

      voAlfName:
        voAlf.voAlfName ||
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
          activeGroupSet.size,

        womenCount:
          womenSet.size,

        groupAmount:
          totalDistributedAmount,

        womenAmount:
          totalDistributedAmount

      },

      fundsRepaid: {

        groupCount:
          repaidGroupSet.size,

        womenCount:
          repaidWomenSet.size,

        groupAmount:
          actualRepaidAmount,

        womenAmount:
          actualRepaidAmount

      },

      currentStatus: {

        debtCycleWomen:
          debtCycleWomen,

        totalInterestReceived:
          totalInterest

      }

    };

  }


  /* ============================================================
     GET REPAYMENT LOAN ID
  ============================================================ */

  getRepaymentLoanId(
    repayment: Repayment
  ): number | null {

    const loanId =
      (repayment as any).loanId;


    if (
      loanId === undefined ||
      loanId === null
    ) {

      return null;

    }


    return Number(
      loanId
    );

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


    if (
      this.selectedYear === null
    ) {

      return true;

    }


    const loanDate =
      new Date(date);


    if (
      isNaN(
        loanDate.getTime()
      )
    ) {

      return false;

    }


    const month =
      loanDate.getMonth() + 1;


    const year =
      loanDate.getFullYear();


    /*
     * April → March
     */

    if (month >= 4) {

      return (
        year ===
        this.selectedYear
      );

    }


    return (
      year ===
      this.selectedYear + 1
    );

  }


  /* ============================================================
     DEBT CYCLE WOMEN
  ============================================================ */

  calculateDebtCycleWomen(
    loans: Loan[]
  ): number {

    const women =
      new Set<number>();


    loans.forEach(
      (loan: Loan) => {

        if (
          loan.id === undefined
        ) {

          return;

        }


        const repayments =
          this.repaymentList.filter(
            (repayment: Repayment) =>
              this.getRepaymentLoanId(
                repayment
              ) === loan.id
          );


        const failedPayments =
          repayments.filter(
            (repayment: any) => {

              const status =
                String(
                  repayment.status ||
                  repayment.paymentStatus ||
                  ''
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
         * 2 or more failed payments.
         */

        if (
          failedPayments.length >= 2 &&
          loan.womanId !== undefined
        ) {

          women.add(
            loan.womanId
          );

        }

      }
    );


    return women.size;

  }


  /* ============================================================
     GET CMRC NAME
  ============================================================ */

  getCmrcName(
    cmrcId: number | null
  ): string {

    if (
      cmrcId === null ||
      cmrcId === undefined
    ) {

      return '-';

    }


    const cmrc =
      this.cmrcList.find(
        (c: Cmrc) =>
          c.id === cmrcId
      );


    return (
      cmrc?.cmrcName ||
      '-'
    );

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
        (record: ReportRecord) => {


          /* ----------------------------------------------
             CMRC FILTER
          ---------------------------------------------- */

          if (
            this.selectedCmrcId !== null &&
            record.cmrcId !==
              this.selectedCmrcId
          ) {

            return false;

          }


          /* ----------------------------------------------
             SEARCH FILTER
          ---------------------------------------------- */

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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

      (
        sum: number,
        record: ReportRecord
      ) =>

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
        (
          record: ReportRecord,
          index: number
        ) => ({

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

          'ALF Received Fund':
            record.fundsReceived
              .alfReceivedFund,

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

          'Women Trapped in Debt Cycle':
            record.currentStatus
              .debtCycleWomen,

          'Total Interest Received':
            record.currentStatus
              .totalInterestReceived

        })
      );


    /* ======================================================
       CREATE WORKSHEET
    ====================================================== */

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );


    /* ======================================================
       CREATE WORKBOOK
    ====================================================== */

    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Fund Loan Report'
    );


    /* ======================================================
       FILE NAME
    ====================================================== */

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