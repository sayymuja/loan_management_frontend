import { Component, OnInit } from '@angular/core';

import {
  CmrcService,
  Cmrc
} from '../services/cmrc.service';

import {
  VoAlfService,
  VoAlf
} from '../services/vo-alf.service';

import {
  LoanService,
  Loan
} from '../services/loan.service';

import {
  RepaymentService
} from '../services/repayment.service';

import * as XLSX from 'xlsx';


/* =========================================================
   REPORT DATA INTERFACES
========================================================= */

interface ReportSection {

  groupCount: number;

  womenCount: number;

  groupAmount: number;

  womenAmount: number;

}


interface CurrentStatus {

  groupCount: number;

  womenCount: number;

  groupAmount: number;

  womenAmount: number;

  ultraPoor: number;

  debtCycleWomen: number;

  total: number;

}


interface FundReportRecord {

  cmrcId: number;

  cmrcName: string;

  villageName: string;

  voAlfId: number;

  voAlfName: string;

  accountNo: string;

  fundsReceived: ReportSection;

  fundsDistributed: ReportSection;

  fundsRepaid: ReportSection;

  reLoan: ReportSection;

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


  /* =======================================================
     CMRC
  ======================================================= */

  cmrcList: Cmrc[] = [];

  selectedCmrcId: number | null = null;


  /* =======================================================
     VO / ALF
  ======================================================= */

  voAlfList: VoAlf[] = [];


  /* =======================================================
     LOANS
  ======================================================= */

  loansByVoAlf: {
    [voAlfId: number]: Loan[];
  } = {};


  /* =======================================================
     REPAYMENTS
  ======================================================= */

  repaymentsByLoan: {
    [loanId: number]: any[];
  } = {};


  /* =======================================================
     REPORT
  ======================================================= */

  reportRecords: FundReportRecord[] = [];

  filteredReportRecords: FundReportRecord[] = [];


  /* =======================================================
     YEAR
  ======================================================= */

  availableYears: number[] = [];

  selectedYear: number | null = null;


  /* =======================================================
     SEARCH
  ======================================================= */

  searchText: string = '';


  /* =======================================================
     LOADING
  ======================================================= */

  loading = false;


  /* =======================================================
     CONSTRUCTOR
  ======================================================= */

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService,
    private repaymentService: RepaymentService
  ) {}


  /* =======================================================
     INIT
  ======================================================= */

  ngOnInit(): void {

    this.loadCmrc();

  }


  /* =======================================================
     LOAD CMRC
  ======================================================= */

  loadCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        this.loadAllVoAlf();

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


  /* =======================================================
     LOAD VO / ALF
     ALL CMRC
  ======================================================= */

  loadAllVoAlf(): void {

    this.voAlfList = [];

    if (
      !this.cmrcList ||
      this.cmrcList.length === 0
    ) {

      this.loading = false;

      return;

    }

    this.loading = true;

    let completed = 0;

    this.cmrcList.forEach(
      (cmrc: Cmrc) => {

        if (
          cmrc.id === undefined ||
          cmrc.id === null
        ) {

          completed++;

          return;

        }

        this.voAlfService
          .getByCmrcId(cmrc.id)
          .subscribe({

            next: (data: VoAlf[]) => {

              if (data && data.length > 0) {

                this.voAlfList.push(
                  ...data
                );

              }

              completed++;

              if (
                completed ===
                this.cmrcList.length
              ) {

                this.loadLoans();

              }

            },

            error: (error) => {

              console.error(
                'VO / ALF API Error:',
                cmrc.id,
                error
              );

              completed++;

              if (
                completed ===
                this.cmrcList.length
              ) {

                this.loadLoans();

              }

            }

          });

      }

    );

  }


  /* =======================================================
     CMRC CHANGE
  ======================================================= */

  onCmrcChange(): void {

    this.applyFilters();

  }


  /* =======================================================
     LOAD LOANS
  ======================================================= */

  loadLoans(): void {

    this.loansByVoAlf = {};

    if (
      !this.voAlfList ||
      this.voAlfList.length === 0
    ) {

      this.buildReport();

      return;

    }

    let completed = 0;

    this.voAlfList.forEach(
      (voAlf: VoAlf) => {

        if (
          voAlf.id === undefined ||
          voAlf.id === null
        ) {

          completed++;

          return;

        }

        const voAlfId =
          Number(voAlf.id);

        this.loanService
          .getByVoAlfId(voAlfId)
          .subscribe({

            next: (data: Loan[]) => {

              this.loansByVoAlf[voAlfId] =
                data || [];

              completed++;

              if (
                completed ===
                this.voAlfList.length
              ) {

                this.loadRepayments();

              }

            },

            error: (error) => {

              console.error(
                'Loan API Error:',
                voAlfId,
                error
              );

              this.loansByVoAlf[voAlfId] =
                [];

              completed++;

              if (
                completed ===
                this.voAlfList.length
              ) {

                this.loadRepayments();

              }

            }

          });

      }

    );

  }


  /* =======================================================
     LOAD REPAYMENTS
  ======================================================= */

  loadRepayments(): void {

    this.repaymentsByLoan = {};

    const allLoans: Loan[] = [];

    Object.keys(
      this.loansByVoAlf
    ).forEach(
      (key: string) => {

        const loans =
          this.loansByVoAlf[
            Number(key)
          ] || [];

        allLoans.push(
          ...loans
        );

      }
    );


    if (allLoans.length === 0) {

      this.buildReport();

      return;

    }


    let completed = 0;


    allLoans.forEach(
      (loan: Loan) => {

        if (
          loan.id === undefined ||
          loan.id === null
        ) {

          completed++;

          return;

        }

        const loanId =
          Number(loan.id);


        /*
         * IMPORTANT:
         *
         * This method name should match
         * your existing RepaymentService.
         *
         * If your service has another method name,
         * we will change only this line.
         */

        this.repaymentService
          .getByLoanId(loanId)
          .subscribe({

            next: (data: any[]) => {

              this.repaymentsByLoan[
                loanId
              ] = data || [];

              completed++;

              if (
                completed ===
                allLoans.length
              ) {

                this.buildReport();

              }

            },

            error: (error) => {

              console.error(
                'Repayment API Error:',
                loanId,
                error
              );

              this.repaymentsByLoan[
                loanId
              ] = [];

              completed++;

              if (
                completed ===
                allLoans.length
              ) {

                this.buildReport();

              }

            }

          });

      }

    );

  }


  /* =======================================================
     BUILD REPORT
  ======================================================= */

  buildReport(): void {

    this.reportRecords = [];

    this.generateAvailableYears();


    this.voAlfList.forEach(
      (voAlf: VoAlf) => {

        if (
          voAlf.id === undefined ||
          voAlf.id === null
        ) {

          return;

        }


        const voAlfId =
          Number(voAlf.id);


        const loans =
          this.loansByVoAlf[
            voAlfId
          ] || [];


        /* ---------------------------------------------------
           CMRC
        --------------------------------------------------- */

        const cmrc =
          this.cmrcList.find(
            (c: Cmrc) =>
              Number(c.id) ===
              Number(voAlf.cmrcId)
          );


        /* ---------------------------------------------------
           FUNDS RECEIVED
        --------------------------------------------------- */

        const fundsReceived =
          this.calculateFundsReceived(
            voAlf
          );


        /* ---------------------------------------------------
           FUNDS DISTRIBUTED
        --------------------------------------------------- */

        const fundsDistributed =
          this.calculateFundsDistributed(
            loans
          );


        /* ---------------------------------------------------
           FUNDS REPAID
        --------------------------------------------------- */

        const fundsRepaid =
          this.calculateFundsRepaid(
            loans
          );


        /* ---------------------------------------------------
           RE-LOAN
        --------------------------------------------------- */

        const reLoan =
          this.calculateReLoan(
            loans
          );


        /* ---------------------------------------------------
           CURRENT STATUS
        --------------------------------------------------- */

        const currentStatus =
          this.calculateCurrentStatus(
            loans
          );


        const record:
          FundReportRecord = {

          cmrcId:
            Number(
              voAlf.cmrcId || 0
            ),

          cmrcName:
            cmrc?.cmrcName || '-',

          villageName:
            voAlf.villageName || '-',

          voAlfId:
            voAlfId,

          voAlfName:
            voAlf.voAlfName || '-',

          accountNo:
            voAlf.accountNo || '-',

          fundsReceived:
            fundsReceived,

          fundsDistributed:
            fundsDistributed,

          fundsRepaid:
            fundsRepaid,

          reLoan:
            reLoan,

          currentStatus:
            currentStatus

        };


        this.reportRecords.push(
          record
        );

      }
    );


    this.applyFilters();

    this.loading = false;


    console.log(
      'Fund Report:',
      this.reportRecords
    );

  }


  /* =======================================================
     FUNDS RECEIVED
  ======================================================= */

  calculateFundsReceived(
    voAlf: VoAlf
  ): ReportSection {

    const amount =
      Number(
        voAlf.receivedFund || 0
      );


    return {

      /*
       * One VO / ALF receiving fund
       * is currently counted as one group.
       *
       * We can refine this later if your
       * business rule is different.
       */

      groupCount:
        amount > 0 ? 1 : 0,

      womenCount:
        0,

      groupAmount:
        amount,

      womenAmount:
        0

    };

  }


  /* =======================================================
     FUNDS DISTRIBUTED
  ======================================================= */

  calculateFundsDistributed(
    loans: Loan[]
  ): ReportSection {


    const validLoans =
      loans || [];


    const uniqueGroups =
      this.getUniqueGroupCount(
        validLoans
      );


    const womenCount =
      validLoans.length;


    const groupAmount =
      validLoans.reduce(
        (
          total: number,
          loan: Loan
        ) => {

          return (
            total +
            Number(
              loan.sanctionedAmount ||
              loan.loanAmount ||
              0
            )
          );

        },
        0
      );


    const womenAmount =
      groupAmount;


    return {

      groupCount:
        uniqueGroups,

      womenCount:
        womenCount,

      groupAmount:
        groupAmount,

      womenAmount:
        womenAmount

    };

  }


  /* =======================================================
     FUNDS REPAID
  ======================================================= */

  calculateFundsRepaid(
    loans: Loan[]
  ): ReportSection {


    let groupCount = 0;

    let womenCount = 0;

    let groupAmount = 0;

    let womenAmount = 0;


    const groups:
      string[] = [];


    (loans || []).forEach(
      (loan: Loan) => {

        if (
          loan.id === undefined ||
          loan.id === null
        ) {

          return;

        }


        const repayments =
          this.repaymentsByLoan[
            Number(loan.id)
          ] || [];


        if (
          repayments.length === 0
        ) {

          return;

        }


        womenCount++;


        const groupName =
          (
            loan.groupName ||
            ''
          ).trim();


        if (
          groupName &&
          !groups.includes(
            groupName
          )
        ) {

          groups.push(
            groupName
          );

        }


        repayments.forEach(
          (repayment: any) => {

            const amount =
              this.getRepaymentAmount(
                repayment
              );

            womenAmount +=
              amount;

          }
        );

      }
    );


    groupCount =
      groups.length;


    groupAmount =
      womenAmount;


    return {

      groupCount:
        groupCount,

      womenCount:
        womenCount,

      groupAmount:
        groupAmount,

      womenAmount:
        womenAmount

    };

  }


  /* =======================================================
     RE-LOAN
     CURRENT SELECTED YEAR
  ======================================================= */

  calculateReLoan(
    loans: Loan[]
  ): ReportSection {


    const selectedLoans =
      (loans || []).filter(
        (loan: Loan) => {

          const year =
            this.getFinancialYear(
              loan.loanGivenDate
            );


          /*
           * If no year is selected,
           * show all re-loans.
           */

          if (
            this.selectedYear === null
          ) {

            return true;

          }


          return (
            year ===
            this.selectedYear
          );

        }
      );


    return {

      groupCount:
        this.getUniqueGroupCount(
          selectedLoans
        ),

      womenCount:
        selectedLoans.length,

      groupAmount:
        selectedLoans.reduce(
          (
            total: number,
            loan: Loan
          ) => {

            return (
              total +
              Number(
                loan.sanctionedAmount ||
                loan.loanAmount ||
                0
              )
            );

          },
          0
        ),

      womenAmount:
        selectedLoans.reduce(
          (
            total: number,
            loan: Loan
          ) => {

            return (
              total +
              Number(
                loan.sanctionedAmount ||
                loan.loanAmount ||
                0
              )
            );

          },
          0
        )

    };

  }


  /* =======================================================
     CURRENT STATUS
  ======================================================= */

  calculateCurrentStatus(
    loans: Loan[]
  ): CurrentStatus {


    const closedLoans =
      (loans || []).filter(
        (loan: Loan) => {

          return (
            (
              loan.loanStatus ||
              ''
            )
              .toUpperCase() ===
            'CLOSED'
          );

        }
      );


    const groupCount =
      this.getUniqueGroupCount(
        closedLoans
      );


    const womenCount =
      closedLoans.length;


    const groupAmount =
      closedLoans.reduce(
        (
          total: number,
          loan: Loan
        ) => {

          return (
            total +
            Number(
              loan.sanctionedAmount ||
              loan.loanAmount ||
              0
            )
          );

        },
        0
      );


    const womenAmount =
      closedLoans.reduce(
        (
          total: number,
          loan: Loan
        ) => {

          return (
            total +
            Number(
              loan.sanctionedAmount ||
              loan.loanAmount ||
              0
            )
          );

        },
        0
      );


    /*
     * These two fields depend on your
     * actual beneficiary classification
     * fields.
     *
     * For now they remain 0.
     */

    const ultraPoor =
      0;


    const debtCycleWomen =
      0;


    const total =
      groupAmount;


    return {

      groupCount:
        groupCount,

      womenCount:
        womenCount,

      groupAmount:
        groupAmount,

      womenAmount:
        womenAmount,

      ultraPoor:
        ultraPoor,

      debtCycleWomen:
        debtCycleWomen,

      total:
        total

    };

  }


  /* =======================================================
     UNIQUE GROUP COUNT
  ======================================================= */

  getUniqueGroupCount(
    loans: Loan[]
  ): number {

    const groups =
      new Set<string>();


    (loans || []).forEach(
      (loan: Loan) => {

        const groupName =
          (
            loan.groupName ||
            ''
          ).trim();


        if (groupName) {

          groups.add(
            groupName.toLowerCase()
          );

        }

      }
    );


    return groups.size;

  }


  /* =======================================================
     REPAYMENT AMOUNT
  ======================================================= */

  getRepaymentAmount(
    repayment: any
  ): number {

    /*
     * Adjust this field after checking
     * your exact Repayment entity/interface.
     */

    return Number(
      repayment.amount ||
      repayment.repaymentAmount ||
      repayment.paidAmount ||
      0
    );

  }


  /* =======================================================
     FINANCIAL YEAR
     APRIL - MARCH
  ======================================================= */

  getFinancialYear(
    dateValue: string | undefined
  ): number | null {

    if (!dateValue) {

      return null;

    }


    const date =
      new Date(dateValue);


    if (
      isNaN(
        date.getTime()
      )
    ) {

      return null;

    }


    const year =
      date.getFullYear();


    const month =
      date.getMonth() + 1;


    return month >= 4
      ? year
      : year - 1;

  }


  /* =======================================================
     GENERATE AVAILABLE YEARS
  ======================================================= */

  generateAvailableYears(): void {

    const years =
      new Set<number>();


    Object.keys(
      this.loansByVoAlf
    ).forEach(
      (key: string) => {

        const loans =
          this.loansByVoAlf[
            Number(key)
          ] || [];


        loans.forEach(
          (loan: Loan) => {

            const year =
              this.getFinancialYear(
                loan.loanGivenDate
              );


            if (year !== null) {

              years.add(
                year
              );

            }

          }
        );

      }
    );


    this.availableYears =
      Array.from(years)
        .sort(
          (
            a: number,
            b: number
          ) => a - b
        );

  }


  /* =======================================================
     YEAR CHANGE
  ======================================================= */

  onYearChange(): void {

    /*
     * Re-build because Re-loan
     * depends on selected year.
     */

    this.buildReport();

  }


  /* =======================================================
     SEARCH + CMRC + YEAR FILTER
  ======================================================= */

  applyFilters(): void {

    let records =
      [...this.reportRecords];


    /* -----------------------------------------------------
       CMRC
    ----------------------------------------------------- */

    if (
      this.selectedCmrcId !== null &&
      this.selectedCmrcId !== undefined
    ) {

      records =
        records.filter(
          (record: FundReportRecord) =>
            Number(
              record.cmrcId
            ) ===
            Number(
              this.selectedCmrcId
            )
        );

    }


    /* -----------------------------------------------------
       SEARCH
    ----------------------------------------------------- */

    if (
      this.searchText &&
      this.searchText.trim()
    ) {

      const search =
        this.searchText
          .trim()
          .toLowerCase();


      records =
        records.filter(
          (record: FundReportRecord) =>

            (
              record.cmrcName ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              record.villageName ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              record.voAlfName ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              record.accountNo ||
              ''
            )
              .toLowerCase()
              .includes(search)

        );

    }


    this.filteredReportRecords =
      records;

  }


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  clearFilters(): void {

    this.selectedYear = null;

    this.selectedCmrcId = null;

    this.searchText = '';

    this.buildReport();

  }


  /* =======================================================
     TOTAL GROUPS
  ======================================================= */

  getTotalGroups(): number {

    const groups =
      new Set<string>();


    this.filteredReportRecords.forEach(
      (record: FundReportRecord) => {

        /*
         * VO / ALF + group count
         * will be refined with exact
         * business mapping later.
         */

        groups.add(
          String(
            record.voAlfId
          )
        );

      }
    );


    return groups.size;

  }


  /* =======================================================
     TOTAL WOMEN
  ======================================================= */

  getTotalWomen(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) => {

          return (
            total +
            record.fundsDistributed
              .womenCount
          );

        },
        0
      );

  }


  /* =======================================================
     TOTAL DISTRIBUTED
  ======================================================= */

  getTotalDistributedAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) => {

          return (
            total +
            record.fundsDistributed
              .groupAmount
          );

        },
        0
      );

  }


  /* =======================================================
     TOTAL REPAID
  ======================================================= */

  getTotalRepaidAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) => {

          return (
            total +
            record.fundsRepaid
              .groupAmount
          );

        },
        0
      );

  }


  /* =======================================================
     TOTAL INTEREST
  ======================================================= */

  getTotalInterestReceived(): number {

    let total = 0;


    this.filteredReportRecords.forEach(
      (record: FundReportRecord) => {

        const loans =
          this.loansByVoAlf[
            record.voAlfId
          ] || [];


        loans.forEach(
          (loan: Loan) => {

            total +=
              Number(
                loan.totalInterestReceived ||
                0
              );

          }
        );

      }
    );


    return total;

  }


  /* =======================================================
     EXCEL EXPORT
  ======================================================= */

  exportToExcel(): void {

    if (
      !this.filteredReportRecords ||
      this.filteredReportRecords.length === 0
    ) {

      alert(
        'No report data available to export.'
      );

      return;

    }


    const excelData =
      this.filteredReportRecords.map(
        (
          record: FundReportRecord,
          index: number
        ) => {

          return {

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

            'Received - Group Count':
              record.fundsReceived.groupCount,

            'Received - Women Count':
              record.fundsReceived.womenCount,

            'Received - Group Amount':
              record.fundsReceived.groupAmount,

            'Received - Women Amount':
              record.fundsReceived.womenAmount,


            /* Funds Distributed */

            'Distributed - Group Count':
              record.fundsDistributed.groupCount,

            'Distributed - Women Count':
              record.fundsDistributed.womenCount,

            'Distributed - Group Amount':
              record.fundsDistributed.groupAmount,

            'Distributed - Women Amount':
              record.fundsDistributed.womenAmount,


            /* Funds Repaid */

            'Repaid - Group Count':
              record.fundsRepaid.groupCount,

            'Repaid - Women Count':
              record.fundsRepaid.womenCount,

            'Repaid - Group Amount':
              record.fundsRepaid.groupAmount,

            'Repaid - Women Amount':
              record.fundsRepaid.womenAmount,


            /* Re-loan */

            'Re-loan - Group Count':
              record.reLoan.groupCount,

            'Re-loan - Women Count':
              record.reLoan.womenCount,

            'Re-loan - Group Amount':
              record.reLoan.groupAmount,

            'Re-loan - Women Amount':
              record.reLoan.womenAmount,


            /* Current Status */

            'Current - Group Count':
              record.currentStatus.groupCount,

            'Current - Women Count':
              record.currentStatus.womenCount,

            'Current - Group Amount':
              record.currentStatus.groupAmount,

            'Current - Women Amount':
              record.currentStatus.womenAmount,

            'Ultra-Poor':
              record.currentStatus.ultraPoor,

            'Women Trapped in Debt Cycle':
              record.currentStatus.debtCycleWomen,

            'Total':
              record.currentStatus.total

          };

        }
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );


    worksheet['!cols'] = [

      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },

      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },

      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },

      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },

      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },

      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 25 },
      { wch: 18 }

    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Fund Report'
    );


    let yearText =
      'All_Years';


    if (
      this.selectedYear !== null
    ) {

      yearText =
        `${this.selectedYear}-${String(
          this.selectedYear + 1
        ).slice(-2)}`;

    }


    const fileName =
      `Fund_Report_${yearText}.xlsx`;


    XLSX.writeFile(
      workbook,
      fileName
    );

  }


  /* =======================================================
     TOTAL FUNCTIONS - RECEIVED
  ======================================================= */

  getTotalReceivedGroupCount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsReceived.groupCount,
        0
      );

  }


  getTotalReceivedWomen(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsReceived.womenCount,
        0
      );

  }


  getTotalReceivedGroupAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsReceived.groupAmount,
        0
      );

  }


  getTotalReceivedWomenAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsReceived.womenAmount,
        0
      );

  }


  /* =======================================================
     TOTAL FUNCTIONS - DISTRIBUTED
  ======================================================= */

  getTotalDistributedGroupCount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsDistributed.groupCount,
        0
      );

  }


  getTotalDistributedWomen(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsDistributed.womenCount,
        0
      );

  }


  getTotalDistributedGroupAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsDistributed.groupAmount,
        0
      );

  }


  getTotalDistributedWomenAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsDistributed.womenAmount,
        0
      );

  }


  /* =======================================================
     TOTAL FUNCTIONS - REPAID
  ======================================================= */

  getTotalRepaidGroupCount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsRepaid.groupCount,
        0
      );

  }


  getTotalRepaidWomen(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsRepaid.womenCount,
        0
      );

  }


  getTotalRepaidGroupAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsRepaid.groupAmount,
        0
      );

  }


  getTotalRepaidWomenAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.fundsRepaid.womenAmount,
        0
      );

  }


  /* =======================================================
     TOTAL FUNCTIONS - RE-LOAN
  ======================================================= */

  getTotalReLoanGroupCount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.reLoan.groupCount,
        0
      );

  }


  getTotalReLoanWomen(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.reLoan.womenCount,
        0
      );

  }


  getTotalReLoanGroupAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.reLoan.groupAmount,
        0
      );

  }


  getTotalReLoanWomenAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.reLoan.womenAmount,
        0
      );

  }


  /* =======================================================
     TOTAL FUNCTIONS - CURRENT
  ======================================================= */

  getTotalCurrentGroupCount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.currentStatus.groupCount,
        0
      );

  }


  getTotalCurrentWomen(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.currentStatus.womenCount,
        0
      );

  }


  getTotalCurrentGroupAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.currentStatus.groupAmount,
        0
      );

  }


  getTotalCurrentWomenAmount(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.currentStatus.womenAmount,
        0
      );

  }


  getTotalUltraPoor(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.currentStatus.ultraPoor,
        0
      );

  }


  getTotalDebtCycleWomen(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.currentStatus.debtCycleWomen,
        0
      );

  }


  getGrandTotal(): number {

    return this.filteredReportRecords
      .reduce(
        (
          total: number,
          record: FundReportRecord
        ) =>
          total +
          record.currentStatus.total,
        0
      );

  }

}