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

import * as XLSX from 'xlsx';


/* =========================================================
   INTEREST RECORD
========================================================= */

export interface InterestRecord {

  loanId?: number;

  cmrcId?: number;
  cmrcName: string;

  voAlfId?: number;
  voAlfName: string;

  villageName: string;

  womanId?: number;
  womanName: string;

  womenCount: number;

  groupId?: number;
  groupName: string;

  receivedFund: number;

  financialYear: number | null;

  interestRate: number | null;

  sanctionedAmount: number;

  totalInterestReceived: number;

  loanStatus: string;
}


/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-interest',
  templateUrl: './interest.component.html',
  styleUrls: ['./interest.component.css']
})
export class InterestComponent implements OnInit {


  /* =======================================================
     MASTER DATA
  ======================================================= */

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  /*
   * CLOSED loans used for Interest Details table
   */
  loanList: Loan[] = [];

  /*
   * ALL loans of selected CMRC.
   *
   * Used for Active / Closed KPI counts.
   */
  allLoanList: Loan[] = [];


  /* =======================================================
     SELECTION
  ======================================================= */

  selectedCmrcId: number | null = null;


  /* =======================================================
     INTEREST RECORDS
  ======================================================= */

  interestRecords: InterestRecord[] = [];

  filteredInterestRecords: InterestRecord[] = [];


  /* =======================================================
     FILTERS
  ======================================================= */

  searchText: string = '';

  selectedYear: number | null = null;

  selectedInterestRate: number | null = null;

  availableYears: number[] = [];

  availableInterestRates: number[] = [];


  /* =======================================================
     VO / ALF INTEREST
  ======================================================= */

  voAlfTotalInterest: {
    [key: number]: number;
  } = {};


  /* =======================================================
     LOADING
  ======================================================= */

  loading: boolean = false;


  /* =======================================================
     CONSTRUCTOR
  ======================================================= */

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService
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

    this.loading = true;

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        this.loading = false;

      },

      error: (error) => {

        console.error(
          'Error loading CMRC:',
          error
        );

        this.cmrcList = [];

        this.loading = false;

      }

    });

  }


  /* =======================================================
     CMRC CHANGE
  ======================================================= */

  onCmrcChange(): void {

    /*
     * Reset filters
     */
    this.searchText = '';

    this.selectedYear = null;

    this.selectedInterestRate = null;


    /*
     * Reset data
     */
    this.voAlfList = [];

    this.loanList = [];

    this.allLoanList = [];

    this.interestRecords = [];

    this.filteredInterestRecords = [];

    this.availableYears = [];

    this.availableInterestRates = [];

    this.voAlfTotalInterest = {};


    if (!this.selectedCmrcId) {
      return;
    }


    /*
     * IMPORTANT:
     *
     * First load VO / ALF.
     * After VO / ALF is loaded,
     * load loans.
     *
     * This allows us to identify loans
     * through VO / ALF hierarchy also.
     */
    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          console.log(
            'VO / ALF FOR SELECTED CMRC:',
            this.voAlfList
          );


          this.loadClosedLoansByCmrc();

        },

        error: (error) => {

          console.error(
            'Error loading VO / ALF:',
            error
          );

          this.voAlfList = [];


          /*
           * Still try loading loans.
           *
           * Some LoanDto responses contain cmrcId
           * directly.
           */
          this.loadClosedLoansByCmrc();

        }

      });

  }


  /* =======================================================
     LOAD LOANS FOR SELECTED CMRC
     
     ALL loans are stored in allLoanList.
     
     CLOSED loans are stored in loanList.
  ======================================================= */

  loadClosedLoansByCmrc(): void {

    if (!this.selectedCmrcId) {

      this.loanList = [];

      this.allLoanList = [];

      this.interestRecords = [];

      this.filteredInterestRecords = [];

      return;

    }


    this.loading = true;


    this.loanService.getAll().subscribe({

      next: (allLoans: Loan[]) => {

        console.log(
          '========== ALL LOANS FROM API =========='
        );

        console.log(allLoans);


        /* =================================================
           GET VO / ALF IDs OF SELECTED CMRC
        ================================================= */

        const cmrcVoAlfIds =
          this.voAlfList
            .map(
              (vo: VoAlf) =>
                Number(vo.id)
            )
            .filter(
              (id: number) =>
                !isNaN(id)
            );


        console.log(
          'VO / ALF IDs FOR SELECTED CMRC:',
          cmrcVoAlfIds
        );


        /* =================================================
           GET ALL LOANS OF SELECTED CMRC
           
           Match:
           1. Direct cmrcId
           OR
           2. voAlfId belongs to selected CMRC
        ================================================= */

        this.allLoanList =
          allLoans.filter(
            (loan: Loan) => {

              const directCmrcMatch =
                loan.cmrcId !== undefined &&
                loan.cmrcId !== null &&
                Number(loan.cmrcId) ===
                Number(this.selectedCmrcId);


              const voAlfMatch =
                loan.voAlfId !== undefined &&
                loan.voAlfId !== null &&
                cmrcVoAlfIds.includes(
                  Number(loan.voAlfId)
                );


              return (
                directCmrcMatch ||
                voAlfMatch
              );

            }
          );


        console.log(
          '========== ALL LOANS FOR SELECTED CMRC =========='
        );

        console.log(
          this.allLoanList
        );


        /* =================================================
           CLOSED LOANS ONLY
           
           These are used by Interest Details table.
        ================================================= */

        this.loanList =
          this.allLoanList.filter(
            (loan: Loan) =>
              this.normalizeStatus(
                loan.loanStatus
              ) === 'CLOSED'
          );


        console.log(
          '========== CLOSED LOANS =========='
        );

        console.log(
          this.loanList
        );


        /* =================================================
           DEBUG COUNTS
        ================================================= */

        const activeCount =
          this.allLoanList.filter(
            (loan: Loan) =>
              this.normalizeStatus(
                loan.loanStatus
              ) === 'ACTIVE'
          ).length;


        const closedCount =
          this.allLoanList.filter(
            (loan: Loan) =>
              this.normalizeStatus(
                loan.loanStatus
              ) === 'CLOSED'
          ).length;


        console.log(
          'ACTIVE LOAN COUNT:',
          activeCount
        );


        console.log(
          'CLOSED LOAN COUNT:',
          closedCount
        );


        /* =================================================
           BUILD INTEREST RECORDS
        ================================================= */

        this.buildInterestRecords();

      },

      error: (error) => {

        console.error(
          'Error loading loans:',
          error
        );

        this.allLoanList = [];

        this.loanList = [];

        this.interestRecords = [];

        this.filteredInterestRecords = [];

        this.loading = false;

      }

    });

  }


  /* =======================================================
     BUILD INTEREST RECORDS
     
     ONLY CLOSED LOANS
  ======================================================= */

  buildInterestRecords(): void {

    this.interestRecords = [];

    this.voAlfTotalInterest = {};


    if (!this.selectedCmrcId) {

      this.filteredInterestRecords = [];

      this.loading = false;

      return;

    }


    /*
     * Safety filter.
     *
     * Even if loanList somehow contains ACTIVE records,
     * they will never be added to Interest Records.
     */
    const closedLoans =
      this.loanList.filter(
        (loan: Loan) =>
          this.normalizeStatus(
            loan.loanStatus
          ) === 'CLOSED'
      );


    /* =====================================================
       SELECTED CMRC
    ===================================================== */

    const selectedCmrc =
      this.cmrcList.find(
        (cmrc: Cmrc) =>
          Number(cmrc.id) ===
          Number(this.selectedCmrcId)
      );


    const selectedCmrcName =
      selectedCmrc?.cmrcName || '-';


    /* =====================================================
       WOMEN COUNT BY VO / ALF
    ===================================================== */

    const womenByVoAlf: {
      [key: number]: Set<string>
    } = {};


    closedLoans.forEach(
      (loan: Loan) => {

        if (
          loan.voAlfId === undefined ||
          loan.voAlfId === null
        ) {

          return;

        }


        const voAlfId =
          Number(loan.voAlfId);


        if (!womenByVoAlf[voAlfId]) {

          womenByVoAlf[voAlfId] =
            new Set<string>();

        }


        if (
          loan.womanName &&
          loan.womanName.trim() !== ''
        ) {

          womenByVoAlf[voAlfId].add(
            loan.womanName.trim()
          );

        }

      }
    );


    /* =====================================================
       CREATE INTEREST RECORDS
    ===================================================== */

    closedLoans.forEach(
      (loan: Loan) => {

        const voAlfId =
          loan.voAlfId !== undefined &&
          loan.voAlfId !== null
            ? Number(loan.voAlfId)
            : undefined;


        const voAlf =
          voAlfId !== undefined
            ? this.voAlfList.find(
                (item: VoAlf) =>
                  Number(item.id) ===
                  voAlfId
              )
            : undefined;


        /* ================================================
           VO / ALF NAME
        ================================================= */

        const voAlfName =
          loan.voAlfName ||
          (voAlf as any)?.voAlfName ||
          '-';


        /* ================================================
           VILLAGE
        ================================================= */

        const villageName =
          loan.villageName ||
          (voAlf as any)?.villageName ||
          '-';


        /* ================================================
           GROUP
        ================================================= */

        const groupName =
          loan.groupName ||
          '-';


        /* ================================================
           RECEIVED FUND
        ================================================= */

        const receivedFund =
          this.getVoAlfReceivedFund(
            voAlf
          );


        /* ================================================
           SANCTIONED AMOUNT
        ================================================= */

        const sanctionedAmount =
          Number(
            loan.sanctionedAmount
          ) || 0;


        /* ================================================
           INTEREST RECEIVED
        ================================================= */

        const totalInterestReceived =
          Number(
            loan.totalInterestReceived
          ) || 0;


        /* ================================================
           FINANCIAL YEAR
        ================================================= */

        const financialYear =
          this.getLoanYear(
            loan.loanGivenDate
          );


        /* ================================================
           INTEREST RATE
        ================================================= */

        const interestRate =
          loan.interestRate !== undefined &&
          loan.interestRate !== null
            ? Number(
                loan.interestRate
              )
            : null;


        /* ================================================
           STATUS
        ================================================= */

        const loanStatus =
          this.normalizeStatus(
            loan.loanStatus
          );


        /* ================================================
           WOMEN COUNT
        ================================================= */

        const womenCount =
          voAlfId !== undefined &&
          womenByVoAlf[voAlfId]
            ? womenByVoAlf[voAlfId].size
            : 0;


        /* ================================================
           CREATE RECORD
        ================================================= */

        const record: InterestRecord = {

          loanId:
            loan.id,

          cmrcId:
            loan.cmrcId ||
            this.selectedCmrcId ||
            undefined,

          cmrcName:
            loan.cmrcName ||
            selectedCmrcName,

          voAlfId:
            loan.voAlfId,

          voAlfName:
            voAlfName,

          villageName:
            villageName,

          womanId:
            loan.womanId,

          womanName:
            loan.womanName ||
            '-',

          womenCount:
            womenCount,

          groupId:
            loan.groupId,

          groupName:
            groupName,

          receivedFund:
            receivedFund,

          financialYear:
            financialYear,

          interestRate:
            interestRate,

          sanctionedAmount:
            sanctionedAmount,

          totalInterestReceived:
            totalInterestReceived,

          loanStatus:
            loanStatus

        };


        this.interestRecords.push(
          record
        );


        /* ================================================
           VO / ALF TOTAL INTEREST
        ================================================= */

        if (
          voAlfId !== undefined
        ) {

          if (
            this.voAlfTotalInterest[
              voAlfId
            ] === undefined
          ) {

            this.voAlfTotalInterest[
              voAlfId
            ] = 0;

          }


          this.voAlfTotalInterest[
            voAlfId
          ] +=
            totalInterestReceived;

        }

      }
    );


    /* =====================================================
       SORT RECORDS
    ===================================================== */

    this.interestRecords.sort(
      (
        a: InterestRecord,
        b: InterestRecord
      ) => {

        const voCompare =
          String(
            a.voAlfName || ''
          ).localeCompare(
            String(
              b.voAlfName || ''
            )
          );


        if (voCompare !== 0) {

          return voCompare;

        }


        const groupCompare =
          String(
            a.groupName || ''
          ).localeCompare(
            String(
              b.groupName || ''
            )
          );


        if (groupCompare !== 0) {

          return groupCompare;

        }


        return String(
          a.womanName || ''
        ).localeCompare(
          String(
            b.womanName || ''
          )
        );

      }
    );


    /* =====================================================
       AVAILABLE FINANCIAL YEARS
       
       CLOSED loans only.
    ===================================================== */

    this.availableYears =
      Array.from(
        new Set(
          this.interestRecords
            .map(
              (
                record: InterestRecord
              ) =>
                record.financialYear
            )
            .filter(
              (
                year:
                  | number
                  | null
              ): year is number =>
                year !== null
            )
        )
      ).sort(
        (a: number, b: number) =>
          b - a
      );


    /* =====================================================
       AVAILABLE INTEREST RATES
       
       CLOSED loans only.
    ===================================================== */

    this.availableInterestRates =
      Array.from(
        new Set(
          this.interestRecords
            .map(
              (
                record: InterestRecord
              ) =>
                record.interestRate
            )
            .filter(
              (
                rate:
                  | number
                  | null
              ): rate is number =>
                rate !== null
            )
        )
      ).sort(
        (a: number, b: number) =>
          a - b
      );


    /* =====================================================
       APPLY TABLE FILTERS
    ===================================================== */

    this.applyFilters();


    this.loading = false;

  }


  /* =======================================================
     NORMALIZE STATUS
  ======================================================= */

  normalizeStatus(
    status: any
  ): string {

    if (
      status === null ||
      status === undefined
    ) {

      return '';

    }


    return String(status)
      .trim()
      .toUpperCase();

  }


  /* =======================================================
     GET VO / ALF RECEIVED FUND
  ======================================================= */

  getVoAlfReceivedFund(
    voAlf: VoAlf | undefined
  ): number {

    if (!voAlf) {

      return 0;

    }


    const value =
      (voAlf as any).receivedFund ??
      (voAlf as any).totalReceivedFund ??
      (voAlf as any).receivedAmount ??
      (voAlf as any).totalAmount ??
      0;


    return Number(value) || 0;

  }


  /* =======================================================
     APPLY TABLE FILTERS
     
     TABLE = CLOSED ONLY
  ======================================================= */

  applyFilters(): void {

    /*
     * Always start with CLOSED records.
     */
    let records =
      this.interestRecords.filter(
        (
          record: InterestRecord
        ) =>
          this.normalizeStatus(
            record.loanStatus
          ) === 'CLOSED'
      );


    /* =====================================================
       SEARCH
    ===================================================== */

    if (
      this.searchText &&
      this.searchText.trim() !== ''
    ) {

      const search =
        this.searchText
          .toLowerCase()
          .trim();


      records =
        records.filter(
          (
            record: InterestRecord
          ) => {

            return (

              (
                record.cmrcName || ''
              )
                .toLowerCase()
                .includes(search)

              ||

              (
                record.voAlfName || ''
              )
                .toLowerCase()
                .includes(search)

              ||

              (
                record.villageName || ''
              )
                .toLowerCase()
                .includes(search)

              ||

              (
                record.womanName || ''
              )
                .toLowerCase()
                .includes(search)

              ||

              (
                record.groupName || ''
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                record.financialYear || ''
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                record.interestRate || ''
              )
                .toLowerCase()
                .includes(search)

            );

          }
        );

    }


    /* =====================================================
       FINANCIAL YEAR
    ===================================================== */

    if (
      this.selectedYear !== null
    ) {

      records =
        records.filter(
          (
            record: InterestRecord
          ) =>
            record.financialYear ===
            this.selectedYear
        );

    }


    /* =====================================================
       INTEREST RATE
    ===================================================== */

    if (
      this.selectedInterestRate !== null
    ) {

      records =
        records.filter(
          (
            record: InterestRecord
          ) =>
            Number(
              record.interestRate
            ) ===
            Number(
              this.selectedInterestRate
            )
        );

    }


    this.filteredInterestRecords =
      records;

  }


  /* =======================================================
     YEAR CHANGE
     
     Table + KPI automatically update.
  ======================================================= */

  onYearChange(): void {

    this.applyFilters();

  }


  /* =======================================================
     RATE CHANGE
  ======================================================= */

  onInterestRateChange(): void {

    this.applyFilters();

  }


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  clearFilters(): void {

    this.searchText = '';

    this.selectedYear = null;

    this.selectedInterestRate = null;

    this.applyFilters();

  }


  /* =======================================================
     GET LOAN YEAR / FINANCIAL YEAR
     
     April to March.
     
     Example:
     Sep 2026 => FY 2026-27
     Feb 2027 => FY 2026-27
     Mar 2027 => FY 2026-27
     Apr 2027 => FY 2027-28
  ======================================================= */

  getLoanYear(
    loanGivenDate: string | undefined
  ): number | null {

    if (!loanGivenDate) {

      return null;

    }


    const date =
      new Date(
        loanGivenDate
      );


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
     FINANCIAL YEAR LABEL
  ======================================================= */

  getFinancialYearLabel(
    year: number | null
  ): string {

    if (
      year === null ||
      year === undefined
    ) {

      return '-';

    }


    return (
      year +
      '-' +
      String(
        year + 1
      ).slice(-2)
    );

  }


  /* =======================================================
     TOTAL WOMEN
     
     Based on filtered CLOSED records.
  ======================================================= */

  getTotalWomen(): number {

    const women =
      new Set<string>();


    this.filteredInterestRecords
      .forEach(
        (
          record: InterestRecord
        ) => {

          if (
            record.womanName &&
            record.womanName !== '-'
          ) {

            women.add(
              record.womanName
                .trim()
                .toLowerCase()
            );

          }

        }
      );


    return women.size;

  }


  /* =======================================================
     TOTAL LOAN AMOUNT
     
     CLOSED filtered records only.
  ======================================================= */

  getTotalLoanAmount(): number {

    return this.filteredInterestRecords
      .reduce(
        (
          total: number,
          record: InterestRecord
        ) => {

          return (
            total +
            (
              Number(
                record.sanctionedAmount
              ) || 0
            )
          );

        },
        0
      );

  }


  /* =======================================================
     TOTAL INTEREST
     
     CLOSED filtered records only.
  ======================================================= */

  getTotalInterest(): number {

    return this.filteredInterestRecords
      .reduce(
        (
          total: number,
          record: InterestRecord
        ) => {

          return (
            total +
            (
              Number(
                record.totalInterestReceived
              ) || 0
            )
          );

        },
        0
      );

  }


  /* =======================================================
     ACTIVE LOAN COUNT
     
     Selected CMRC
     +
     Selected Financial Year
     +
     ACTIVE status
  ======================================================= */

  getTotalActiveLoans(): number {

    return this.getLoanCountByStatus(
      'ACTIVE'
    );

  }


  /* =======================================================
     CLOSED LOAN COUNT
     
     Selected CMRC
     +
     Selected Financial Year
     +
     CLOSED status
  ======================================================= */

  getTotalClosedLoans(): number {

    return this.getLoanCountByStatus(
      'CLOSED'
    );

  }


  /* =======================================================
     LOAN COUNT BY STATUS
  ======================================================= */

  private getLoanCountByStatus(
    status: string
  ): number {

    if (!this.selectedCmrcId) {

      return 0;

    }


    /*
     * Start from ALL loans.
     *
     * Do NOT use loanList here because loanList
     * contains CLOSED loans only.
     */
    let loans =
      this.allLoanList.filter(
        (loan: Loan) =>
          this.normalizeStatus(
            loan.loanStatus
          ) ===
          this.normalizeStatus(
            status
          )
      );


    /* =====================================================
       FINANCIAL YEAR FILTER
    ===================================================== */

    if (
      this.selectedYear !== null
    ) {

      loans =
        loans.filter(
          (loan: Loan) =>
            this.getLoanYear(
              loan.loanGivenDate
            ) ===
            this.selectedYear
        );

    }


    return loans.length;

  }


  /* =======================================================
     OLD METHOD SUPPORT
     
     If old HTML has:
     {{ getActiveLoans() }}
     
     it will still work.
     
     Returns ACTIVE count.
  ======================================================= */

  getActiveLoans(): number {

    return this.getTotalActiveLoans();

  }


  /* =======================================================
     GET LOAN INTEREST
  ======================================================= */

  getLoanInterest(
    loanId: number | undefined
  ): number {

    if (!loanId) {

      return 0;

    }


    const record =
      this.interestRecords.find(
        (
          item: InterestRecord
        ) =>
          Number(
            item.loanId
          ) ===
          Number(
            loanId
          )
      );


    return record
      ? Number(
          record.totalInterestReceived
        ) || 0
      : 0;

  }


  /* =======================================================
     VO / ALF FILTERED INTEREST
  ======================================================= */

  getVoAlfFilteredInterest(
    voAlfId: number | undefined
  ): number {

    if (!voAlfId) {

      return 0;

    }


    return this.filteredInterestRecords
      .filter(
        (
          record: InterestRecord
        ) =>
          Number(
            record.voAlfId
          ) ===
          Number(
            voAlfId
          )
      )
      .reduce(
        (
          total: number,
          record: InterestRecord
        ) => {

          return (
            total +
            (
              Number(
                record.totalInterestReceived
              ) || 0
            )
          );

        },
        0
      );

  }


  /* =======================================================
     GROUP ROWSPAN
  ======================================================= */

  getGroupRowspan(
    index: number
  ): number {

    if (
      index < 0 ||
      index >=
      this.filteredInterestRecords.length
    ) {

      return 1;

    }


    const current =
      this.filteredInterestRecords[
        index
      ];


    if (
      current.voAlfId === undefined ||
      current.voAlfId === null
    ) {

      return 1;

    }


    let count = 1;


    for (
      let i = index + 1;
      i <
      this.filteredInterestRecords.length;
      i++
    ) {

      const next =
        this.filteredInterestRecords[
          i
        ];


      if (
        Number(
          next.voAlfId
        ) ===
        Number(
          current.voAlfId
        )
      ) {

        count++;

      } else {

        break;

      }

    }


    return count;

  }


  /* =======================================================
     FIRST VO / ALF ROW
  ======================================================= */

  isFirstVoAlfRow(
    index: number
  ): boolean {

    if (index === 0) {

      return true;

    }


    const current =
      this.filteredInterestRecords[
        index
      ];

    const previous =
      this.filteredInterestRecords[
        index - 1
      ];


    return Number(
      current.voAlfId
    ) !==
    Number(
      previous.voAlfId
    );

  }


  /* =======================================================
     GROUP SERIAL NUMBER
  ======================================================= */

  getGroupSerialNumber(
    index: number
  ): number {

    let serial = 1;


    for (
      let i = 0;
      i < index;
      i++
    ) {

      if (
        this.isFirstVoAlfRow(i)
      ) {

        serial++;

      }

    }


    return serial;

  }


  /* =======================================================
     GROUP COLOR
  ======================================================= */

  getGroupColorIndex(
    voAlfId: number | undefined
  ): number {

    if (!voAlfId) {

      return 0;

    }


    const uniqueVoAlfIds =
      Array.from(
        new Set(
          this.filteredInterestRecords
            .map(
              (
                record: InterestRecord
              ) =>
                record.voAlfId
            )
            .filter(
              (
                id:
                  | number
                  | undefined
              ): id is number =>
                id !== undefined
            )
        )
      );


    const index =
      uniqueVoAlfIds.findIndex(
        (
          id: number
        ) =>
          Number(id) ===
          Number(voAlfId)
      );


    return index >= 0
      ? index % 8
      : 0;

  }


  /* =======================================================
     EXPORT EXCEL
     
     CLOSED filtered records only.
  ======================================================= */

  exportToExcel(): void {

    if (
      this.filteredInterestRecords.length === 0
    ) {

      return;

    }


    const exportData =
      this.filteredInterestRecords.map(
        (
          record: InterestRecord,
          index: number
        ) => ({

          '#':
            index + 1,

          'CMRC':
            record.cmrcName,

          'VO / ALF':
            record.voAlfName,

          'Village':
            record.villageName,

          'Woman':
            record.womanName,

          'Women':
            record.womenCount,

          'Group':
            record.groupName,

          'VO / ALF Received':
            record.receivedFund,

          'Financial Year':
            this.getFinancialYearLabel(
              record.financialYear
            ),

          'Rate':
            record.interestRate !== null
              ? record.interestRate + '%'
              : '-',

          'Loan Amount':
            record.sanctionedAmount,

          'Interest Received':
            record.totalInterestReceived,

          'Status':
            record.loanStatus,

          'VO / ALF Interest Received':
            this.getVoAlfFilteredInterest(
              record.voAlfId
            )

        })
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Interest Details'
    );


    XLSX.writeFile(
      workbook,
      'Interest_Details.xlsx'
    );

  }

}