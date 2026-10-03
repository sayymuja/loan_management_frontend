import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { GroupService, Group } from '../services/group.service';
import { WomenService, Women } from '../services/women.service';
import { LoanService, Loan } from '../services/loan.service';
import { RepaymentService, Repayment } from '../services/repayment.service';


/* =========================================================
   REPORT INTERFACES
========================================================= */

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

interface ReLoan {
  groupCount: number;
  womenCount: number;
  groupAmount: number;
  womenAmount: number;
}

interface CurrentStatus {
  ultrapoorWomen: number;
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

  reLoan: ReLoan;

  currentStatus: CurrentStatus;
}


/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {


  /* =========================================================
     FILTERS
  ========================================================= */

  selectedYear: number | null = null;

  selectedCmrcId: number | null = null;

  searchText = '';

  availableYears: number[] = [
    2024,
    2025,
    2026
  ];


  /* =========================================================
     MASTER DATA
  ========================================================= */

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  groupList: Group[] = [];

  womenList: Women[] = [];

  loanList: Loan[] = [];

  repaymentList: Repayment[] = [];


  /* =========================================================
     REPORT DATA
  ========================================================= */

  reportRecords: ReportRecord[] = [];

  filteredReportRecords: ReportRecord[] = [];


  /* =========================================================
     UI STATE
  ========================================================= */

  loading = false;


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService,
    private loanService: LoanService,
    private repaymentService: RepaymentService
  ) {}


  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {

    this.loadAllReportData();

  }


  /* =========================================================
     LOAD ALL REPORT DATA
  ========================================================= */

  loadAllReportData(): void {

    this.loading = true;


    /* -------------------------------------------------------
       1. CMRC
    ------------------------------------------------------- */

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];


        /*
         * Default CMRC
         * First CMRC will be selected automatically.
         */

        if (this.cmrcList.length > 0) {

          const firstCmrc = this.cmrcList[0];

          this.selectedCmrcId =
            firstCmrc.id != null
              ? Number(firstCmrc.id)
              : null;

        } else {

          this.selectedCmrcId = null;

        }


        /* ---------------------------------------------------
           2. VO / ALF
        --------------------------------------------------- */

        this.voAlfService.getAll().subscribe({

          next: (voData: VoAlf[]) => {

            this.voAlfList = voData || [];


            /* -----------------------------------------------
               3. GROUP
            ----------------------------------------------- */

            this.groupService.getAll().subscribe({

              next: (groupData: Group[]) => {

                this.groupList = groupData || [];


                /* -------------------------------------------
                   4. WOMEN
                ------------------------------------------- */

                this.womenService.getAll().subscribe({

                  next: (womenData: Women[]) => {

                    this.womenList = womenData || [];


                    /* ---------------------------------------
                       5. LOAN
                    --------------------------------------- */

                    this.loanService.getAll().subscribe({

                      next: (loanData: Loan[]) => {

                        this.loanList = loanData || [];


                        /* -----------------------------------
                           6. REPAYMENT
                        ----------------------------------- */

                        this.repaymentService.getAll().subscribe({

                          next: (repaymentData: Repayment[]) => {

                            this.repaymentList =
                              repaymentData || [];


                            this.buildReport();

                            this.loading = false;

                          },

                          error: () => {

                            this.repaymentList = [];

                            this.buildReport();

                            this.loading = false;

                          }

                        });

                      },

                      error: () => {

                        this.loanList = [];

                        this.buildReport();

                        this.loading = false;

                      }

                    });

                  },

                  error: () => {

                    this.womenList = [];

                    this.buildReport();

                    this.loading = false;

                  }

                });

              },

              error: () => {

                this.groupList = [];

                this.buildReport();

                this.loading = false;

              }

            });

          },

          error: () => {

            this.voAlfList = [];

            this.buildReport();

            this.loading = false;

          }

        });

      },

      error: () => {

        this.cmrcList = [];

        this.selectedCmrcId = null;

        this.loading = false;

        this.buildReport();

      }

    });

  }


  /* =========================================================
     BUILD REPORT
  ========================================================= */

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


  /* =========================================================
     CREATE REPORT RECORD
  ========================================================= */

  createReportRecord(
    voAlf: VoAlf
  ): ReportRecord {

    const voAlfId =
      voAlf.id != null
        ? Number(voAlf.id)
        : null;


    const cmrcId =
      (voAlf as any).cmrcId != null
        ? Number((voAlf as any).cmrcId)
        : null;


    const cmrcName =
      this.getCmrcName(cmrcId);


    const villageName =
      (voAlf as any).villageName ||
      '-';


    const voAlfName =
      (voAlf as any).voAlfName ||
      '-';


    const accountNo =
      String(
        (voAlf as any).accountNo || ''
      );


    /* =====================================================
       GROUPS
    ===================================================== */

    const voGroups =
      this.groupList.filter(
        (group: any) =>
          Number(group.voAlfId) ===
          Number(voAlfId)
      );


    const groupIds =
      new Set<number>();


    voGroups.forEach(
      (group: any) => {

        if (group.id != null) {

          groupIds.add(
            Number(group.id)
          );

        }

      }
    );


    /* =====================================================
       WOMEN
    ===================================================== */

    const voWomen =
      this.womenList.filter(
        (woman: any) =>
          groupIds.has(
            Number(woman.groupId)
          )
      );


    const womanIds =
      new Set<number>();


    voWomen.forEach(
      (woman: any) => {

        if (woman.id != null) {

          womanIds.add(
            Number(woman.id)
          );

        }

      }
    );


    /* =====================================================
       LOANS
    ===================================================== */

    const voLoans =
      this.loanList.filter(
        (loan: any) =>
          womanIds.has(
            Number(loan.womanId)
          )
      );


    /*
     * Apply financial year only when selected.
     */

    const yearLoans =
      voLoans.filter(
        (loan: any) =>
          this.isInSelectedFinancialYear(
            loan.loanGivenDate
          )
      );


    /* =====================================================
       DISTRIBUTED GROUPS
    ===================================================== */

    const distributedGroupKeys =
      new Set<string>();


    yearLoans.forEach(
      (loan: any) => {

        const womanId =
          loan.womanId != null
            ? Number(loan.womanId)
            : null;


        const woman =
          this.womenList.find(
            (item: any) =>
              Number(item.id) ===
              Number(womanId)
          );


        const group =
          woman
            ? this.groupList.find(
                (item: any) =>
                  Number(item.id) ===
                  Number(woman.groupId)
              )
            : null;


        const key =
          group && group.id != null
            ? `group-${group.id}`
            : `woman-${womanId}`;


        distributedGroupKeys.add(key);

      }
    );


    /* =====================================================
       DISTRIBUTED WOMEN
    ===================================================== */

    const distributedWomen =
      new Set<number>();


    yearLoans.forEach(
      (loan: any) => {

        if (loan.womanId != null) {

          distributedWomen.add(
            Number(loan.womanId)
          );

        }

      }
    );


    /* =====================================================
       DISTRIBUTED AMOUNT
    ===================================================== */

    const distributedAmount =
      yearLoans.reduce(
        (
          total: number,
          loan: any
        ) =>
          total +
          this.getLoanAmount(loan),
        0
      );


    /* =====================================================
       REPAYMENTS
    ===================================================== */

    const loanIds =
      new Set<number>();


    yearLoans.forEach(
      (loan: any) => {

        if (loan.id != null) {

          loanIds.add(
            Number(loan.id)
          );

        }

      }
    );


    const voRepayments =
      this.repaymentList.filter(
        (repayment: any) =>
          loanIds.has(
            Number(
              this.getRepaymentLoanId(
                repayment
              )
            )
          )
      );


    /* =====================================================
       REPAID LOANS
    ===================================================== */

    const repaidLoanIds =
      new Set<number>();


    voRepayments.forEach(
      (repayment: any) => {

        const loanId =
          this.getRepaymentLoanId(
            repayment
          );


        const status =
          String(
            repayment.paymentStatus ||
            repayment.status ||
            ''
          ).toUpperCase();


        const paidAmount =
          this.toNumber(
            repayment.paymentAmount ??
            repayment.paidAmount ??
            repayment.amount ??
            0
          );


        if (
          status === 'PAID' ||
          status === 'PARTIAL' ||
          paidAmount > 0
        ) {

          if (loanId != null) {

            repaidLoanIds.add(
              Number(loanId)
            );

          }

        }

      }
    );


    /* =====================================================
       REPAID GROUPS
    ===================================================== */

    const repaidGroupKeys =
      new Set<string>();


    yearLoans.forEach(
      (loan: any) => {

        if (
          loan.id == null ||
          !repaidLoanIds.has(
            Number(loan.id)
          )
        ) {

          return;

        }


        const woman =
          this.womenList.find(
            (item: any) =>
              Number(item.id) ===
              Number(loan.womanId)
          );


        const group =
          woman
            ? this.groupList.find(
                (item: any) =>
                  Number(item.id) ===
                  Number(woman.groupId)
              )
            : null;


        const key =
          group && group.id != null
            ? `group-${group.id}`
            : `woman-${loan.womanId}`;


        repaidGroupKeys.add(key);

      }
    );


    /* =====================================================
       REPAID WOMEN
    ===================================================== */

    const repaidWomen =
      new Set<number>();


    yearLoans.forEach(
      (loan: any) => {

        if (
          loan.id != null &&
          repaidLoanIds.has(
            Number(loan.id)
          ) &&
          loan.womanId != null
        ) {

          repaidWomen.add(
            Number(loan.womanId)
          );

        }

      }
    );


    /* =====================================================
       REPAID AMOUNT
    ===================================================== */

    const repaidAmount =
      voRepayments.reduce(
        (
          total: number,
          repayment: any
        ) => {

          const status =
            String(
              repayment.paymentStatus ||
              repayment.status ||
              ''
            ).toUpperCase();


          const paidAmount =
            this.toNumber(
              repayment.paymentAmount ??
              repayment.paidAmount ??
              repayment.amount ??
              0
            );


          if (
            status === 'PAID' ||
            status === 'PARTIAL' ||
            paidAmount > 0
          ) {

            return total + paidAmount;

          }


          return total;

        },
        0
      );


    /* =====================================================
       INTEREST RECEIVED
    ===================================================== */

    const totalInterest =
      voRepayments.reduce(
        (
          total: number,
          repayment: any
        ) => {

          return (
            total +
            this.toNumber(
              repayment.interestAmount ??
              repayment.interest ??
              0
            )
          );

        },
        0
      );


    /* =====================================================
       DEBT CYCLE WOMEN
    ===================================================== */

    const debtCycleWomen =
      this.calculateDebtCycleWomen(
        yearLoans
      );


    /* =====================================================
       ULTRA-POOR WOMEN
    ===================================================== */

    const ultrapoorWomen =
      this.calculateUltrapoorWomen(
        voWomen
      );


    /* =====================================================
       VO / ALF RECEIVED FUND
    ===================================================== */

    const alfReceivedFund =
      this.getVoAlfReceivedFund(
        voAlf
      );


    /* =====================================================
       RE-LOAN
       
       Backend currently does not expose a reliable
       re-loan identifier.
       
       Therefore these values remain zero instead of
       incorrectly duplicating distributed amounts.
    ===================================================== */

    const reLoan: ReLoan = {

      groupCount: 0,

      womenCount: 0,

      groupAmount: 0,

      womenAmount: 0

    };


    /* =====================================================
       FINAL RECORD
    ===================================================== */

    return {

      cmrcId,

      cmrcName,

      villageName,

      voAlfId,

      voAlfName,

      accountNo,

      fundsReceived: {

        alfReceivedFund

      },

      fundsDistributed: {

        groupCount:
          distributedGroupKeys.size,

        womenCount:
          distributedWomen.size,

        /*
         * Current backend does not expose separate
         * group/women distribution amounts.
         */

        groupAmount:
          distributedAmount,

        womenAmount:
          distributedAmount

      },

      fundsRepaid: {

        groupCount:
          repaidGroupKeys.size,

        womenCount:
          repaidWomen.size,

        /*
         * Current backend does not expose separate
         * group/women repayment amounts.
         */

        groupAmount:
          repaidAmount,

        womenAmount:
          repaidAmount

      },

      reLoan,

      currentStatus: {

        ultrapoorWomen,

        debtCycleWomen,

        totalInterestReceived:
          totalInterest

      }

    };

  }


  /* =========================================================
     LOAN AMOUNT
  ========================================================= */

  getLoanAmount(
    loan: any
  ): number {

    return this.toNumber(

      loan?.loanAmount ??
      loan?.disbursedAmount ??
      loan?.totalAmount ??
      loan?.sanctionedAmount ??
      0

    );

  }


  /* =========================================================
     REPAYMENT LOAN ID
  ========================================================= */

  getRepaymentLoanId(
    repayment: any
  ): number | null {

    const id =
      repayment?.loanId ??
      repayment?.loan?.id ??
      repayment?.loan_id ??
      null;


    if (id == null) {

      return null;

    }


    const numericId =
      Number(id);


    return isNaN(numericId)
      ? null
      : numericId;

  }


  /* =========================================================
     FINANCIAL YEAR CHECK
     
     Apr-Dec => selectedYear
     Jan-Mar => selectedYear + 1
  ========================================================= */

  isInSelectedFinancialYear(
    dateValue: any
  ): boolean {

    if (!this.selectedYear) {

      return true;

    }


    if (!dateValue) {

      return true;

    }


    const date =
      new Date(dateValue);


    if (isNaN(date.getTime())) {

      return true;

    }


    const month =
      date.getMonth() + 1;


    const year =
      date.getFullYear();


    if (
      month >= 4 &&
      month <= 12
    ) {

      return (
        year ===
        Number(this.selectedYear)
      );

    }


    return (
      year ===
      Number(this.selectedYear) + 1
    );

  }


  /* =========================================================
     DEBT CYCLE WOMEN
     
     Counts unique women having 2 or more problematic
     repayment statuses.
  ========================================================= */

  calculateDebtCycleWomen(
    loans: Loan[]
  ): number {

    const problematicStatuses =
      [
        'BOUNCED',
        'UNPAID',
        'FAILED',
        'OVERDUE'
      ];


    const womanFailureCount =
      new Map<number, number>();


    loans.forEach(
      (loan: any) => {

        if (loan.id == null) {

          return;

        }


        const repayments =
          this.repaymentList.filter(
            (repayment: any) =>
              Number(
                this.getRepaymentLoanId(
                  repayment
                )
              ) ===
              Number(loan.id)
          );


        repayments.forEach(
          (repayment: any) => {

            const status =
              String(
                repayment.paymentStatus ||
                repayment.status ||
                ''
              ).toUpperCase();


            if (
              problematicStatuses.includes(
                status
              )
            ) {

              const womanId =
                Number(
                  loan.womanId
                );


              if (!isNaN(womanId)) {

                womanFailureCount.set(

                  womanId,

                  (
                    womanFailureCount.get(
                      womanId
                    ) || 0
                  ) + 1

                );

              }

            }

          }
        );

      }
    );


    let count = 0;


    womanFailureCount.forEach(
      (failureCount: number) => {

        if (failureCount >= 2) {

          count++;

        }

      }
    );


    return count;

  }


  /* =========================================================
     ULTRA-POOR WOMEN
     
     Supports multiple possible backend field names.
  ========================================================= */

  calculateUltrapoorWomen(
    women: Women[]
  ): number {

    let count = 0;


    women.forEach(
      (item: any) => {

        const raw =
          item?.ultrapoor ??
          item?.ultraPoor ??
          item?.ultraPoorWoman ??
          item?.isUltrapoor ??
          item?.isUltraPoor ??
          null;


        const category =
          String(
            item?.category ||
            ''
          ).toUpperCase();


        const isUltraPoor =
          raw === true ||
          raw === 1 ||
          String(raw).toLowerCase() === 'true' ||
          String(raw).toLowerCase() === 'yes' ||
          category === 'ULTRAPOOR' ||
          category === 'ULTRA_POOR';


        if (isUltraPoor) {

          count++;

        }

      }
    );


    return count;

  }


  /* =========================================================
     GET CMRC NAME
  ========================================================= */

  getCmrcName(
    cmrcId: number | null
  ): string {

    if (cmrcId == null) {

      return '-';

    }


    const cmrc =
      this.cmrcList.find(
        (item: Cmrc) =>
          Number(item.id) ===
          Number(cmrcId)
      );


    return (
      (cmrc as any)?.cmrcName ||
      '-'
    );

  }


  /* =========================================================
     GET SELECTED CMRC NAME
  ========================================================= */

  getSelectedCmrcName(): string {

    if (this.selectedCmrcId == null) {

      return 'All CMRC';

    }


    return this.getCmrcName(
      this.selectedCmrcId
    );

  }


  /* =========================================================
     GET FINANCIAL YEAR LABEL
  ========================================================= */

  getSelectedFinancialYearLabel(): string {

    if (!this.selectedYear) {

      return 'All Financial Years';

    }


    return (
      `${this.selectedYear}-${String(
        this.selectedYear + 1
      ).slice(-2)}`
    );

  }


  /* =========================================================
     FINANCIAL YEAR CHANGE
  ========================================================= */

  onYearChange(): void {

    this.buildReport();

  }


  /* =========================================================
     CMRC CHANGE
  ========================================================= */

  onCmrcChange(): void {

    this.applyFilters();

  }


  /* =========================================================
     APPLY FILTERS
  ========================================================= */

  applyFilters(): void {

    let records =
      [...this.reportRecords];


    /* -------------------------------------------------------
       CMRC FILTER
    ------------------------------------------------------- */

    if (this.selectedCmrcId != null) {

      records =
        records.filter(
          (record: ReportRecord) =>
            Number(record.cmrcId) ===
            Number(this.selectedCmrcId)
        );

    }


    /* -------------------------------------------------------
       SEARCH FILTER
    ------------------------------------------------------- */

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    if (search) {

      records =
        records.filter(
          (record: ReportRecord) => {

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


    this.filteredReportRecords =
      records;

  }


  /* =========================================================
     CLEAR FILTERS
     
     First CMRC remains selected by default.
  ========================================================= */

  clearFilters(): void {

    this.selectedYear = null;

    this.searchText = '';


    if (this.cmrcList.length > 0) {

      const firstCmrc =
        this.cmrcList[0];


      this.selectedCmrcId =
        firstCmrc.id != null
          ? Number(firstCmrc.id)
          : null;

    } else {

      this.selectedCmrcId = null;

    }


    this.buildReport();

  }


  /* =========================================================
     NUMBER CONVERSION
  ========================================================= */

  toNumber(
    value: any
  ): number {

    const numberValue =
      Number(value);


    return isNaN(numberValue)
      ? 0
      : numberValue;

  }


  /* =========================================================
     VO / ALF RECEIVED FUND
  ========================================================= */

  getVoAlfReceivedFund(
    voAlf: VoAlf
  ): number {

    const item: any =
      voAlf as any;


    return this.toNumber(

      item?.receivedFund ??
      item?.recievedFund ??
      item?.alfBalance ??
      item?.balanceAmount ??
      item?.totalAmount ??
      0

    );

  }


  /* =========================================================
     SUMMARY
  ========================================================= */

  getTotalAlfReceivedFund(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsReceived
            ?.alfReceivedFund
        ),

      0

    );

  }


  getTotalDistributedGroupCount(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsDistributed
            ?.groupCount
        ),

      0

    );

  }


  getTotalDistributedWomen(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsDistributed
            ?.womenCount
        ),

      0

    );

  }


  getTotalDistributedGroupAmount(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsDistributed
            ?.groupAmount
        ),

      0

    );

  }


  getTotalDistributedWomenAmount(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsDistributed
            ?.womenAmount
        ),

      0

    );

  }


  getTotalRepaidGroupCount(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsRepaid
            ?.groupCount
        ),

      0

    );

  }


  getTotalRepaidWomen(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsRepaid
            ?.womenCount
        ),

      0

    );

  }


  getTotalRepaidGroupAmount(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsRepaid
            ?.groupAmount
        ),

      0

    );

  }


  getTotalRepaidWomenAmount(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.fundsRepaid
            ?.womenAmount
        ),

      0

    );

  }


  getTotalDebtCycleWomen(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.currentStatus
            ?.debtCycleWomen
        ),

      0

    );

  }


  getTotalInterestReceived(): number {

    return this.filteredReportRecords.reduce(

      (
        total: number,
        record: ReportRecord
      ) =>
        total +
        this.toNumber(
          record.currentStatus
            ?.totalInterestReceived
        ),

      0

    );

  }


  /* =========================================================
     RECORD COUNTS
  ========================================================= */

  getTotalRecords(): number {

    return this.filteredReportRecords.length;

  }


  getTotalVoAlfRecords(): number {

    return this.filteredReportRecords.length;

  }


  /* =========================================================
     ACTIVE FILTER CHECK
  ========================================================= */

  hasActiveFilters(): boolean {

    return (
      this.selectedYear !== null ||
      this.searchText.trim().length > 0
    );

  }


  /* =========================================================
     TRACK BY
  ========================================================= */

  trackByVoAlf(
    index: number,
    record: ReportRecord
  ): number | string {

    return (
      record.voAlfId ??
      index
    );

  }


  /* =========================================================
     EXPORT TO EXCEL
  ========================================================= */

  exportToExcel(): void {

    if (
      !this.filteredReportRecords ||
      this.filteredReportRecords.length === 0
    ) {

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
            record.accountNo || '-',

          'Fund Received':
            this.toNumber(
              record.fundsReceived
                ?.alfReceivedFund
            ),

          'Distributed Fund - Group Count':
            this.toNumber(
              record.fundsDistributed
                ?.groupCount
            ),

          'Distributed Fund - Women Count':
            this.toNumber(
              record.fundsDistributed
                ?.womenCount
            ),

          'Distributed Fund - Group Amount':
            this.toNumber(
              record.fundsDistributed
                ?.groupAmount
            ),

          'Distributed Fund - Women Amount':
            this.toNumber(
              record.fundsDistributed
                ?.womenAmount
            ),

          'Repaid Fund - Group Count':
            this.toNumber(
              record.fundsRepaid
                ?.groupCount
            ),

          'Repaid Fund - Women Count':
            this.toNumber(
              record.fundsRepaid
                ?.womenCount
            ),

          'Repaid Fund - Group Amount':
            this.toNumber(
              record.fundsRepaid
                ?.groupAmount
            ),

          'Repaid Fund - Women Amount':
            this.toNumber(
              record.fundsRepaid
                ?.womenAmount
            ),

          'Re-loan - Group Count':
            this.toNumber(
              record.reLoan
                ?.groupCount
            ),

          'Re-loan - Women Count':
            this.toNumber(
              record.reLoan
                ?.womenCount
            ),

          'Re-loan - Group Amount':
            this.toNumber(
              record.reLoan
                ?.groupAmount
            ),

          'Re-loan - Women Amount':
            this.toNumber(
              record.reLoan
                ?.womenAmount
            ),

          'Ultra-Poor Women':
            this.toNumber(
              record.currentStatus
                ?.ultrapoorWomen
            ),

          'Women in Debt Cycle':
            this.toNumber(
              record.currentStatus
                ?.debtCycleWomen
            ),

          'Interest Received':
            this.toNumber(
              record.currentStatus
                ?.totalInterestReceived
            )

        })
      );


    /* =====================================================
       CREATE WORKSHEET
    ===================================================== */

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );


    /* =====================================================
       COLUMN WIDTHS
    ===================================================== */

    worksheet['!cols'] = [

      { wch: 8 },

      { wch: 28 },

      { wch: 22 },

      { wch: 28 },

      { wch: 22 },

      { wch: 18 },

      { wch: 20 },

      { wch: 20 },

      { wch: 22 },

      { wch: 22 },

      { wch: 20 },

      { wch: 20 },

      { wch: 22 },

      { wch: 22 },

      { wch: 18 },

      { wch: 18 },

      { wch: 20 },

      { wch: 20 },

      { wch: 20 },

      { wch: 24 },

      { wch: 20 }

    ];


    /* =====================================================
       CREATE WORKBOOK
    ===================================================== */

    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(

      workbook,

      worksheet,

      'Fund & Loan Report'

    );


    /* =====================================================
       FILE NAME
    ===================================================== */

    const yearText =
      this.selectedYear

        ? `${this.selectedYear}-${String(
            this.selectedYear + 1
          ).slice(-2)}`

        : 'All-Years';


    const cmrcText =
      this.getSelectedCmrcName()
        .replace(
          /[^a-zA-Z0-9]+/g,
          '_'
        )
        .replace(
          /^_+|_+$/g,
          ''
        );


    const fileName =
      `Fund_Loan_Report_${cmrcText}_${yearText}.xlsx`;


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    XLSX.writeFile(
      workbook,
      fileName
    );

  }

}