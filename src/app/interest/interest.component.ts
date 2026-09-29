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

interface InterestRecord {

  voAlfId: number;

  cmrcId: number;

  cmrcName: string;

  voAlfName: string;

  villageName: string;

  receivedFund: number;

  loanId?: number;

  womanName: string;

  groupName: string;

  loanAmount: number;

  loanGivenDate?: string;

  financialYear: number | null;

  interestRate: number | null;

  totalInterestReceived: number;

  loanStatus?: string;

  voAlfTotalInterest: number;

  womenCount: number;
}


@Component({
  selector: 'app-interest',
  templateUrl: './interest.component.html',
  styleUrls: ['./interest.component.css']
})
export class InterestComponent implements OnInit {


  // =========================================================
  // DATA
  // =========================================================

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  loansByVoAlf: {
    [voAlfId: number]: Loan[];
  } = {};

  interestRecords: InterestRecord[] = [];

  filteredInterestRecords: InterestRecord[] = [];


  // =========================================================
  // SELECTED CMRC
  // =========================================================

  selectedCmrcId: number | null = null;


  // =========================================================
  // SEARCH
  // =========================================================

  searchText: string = '';


  // =========================================================
  // FILTERS
  // =========================================================

  availableYears: number[] = [];

  availableInterestRates: number[] = [];

  selectedYear: number | null = null;

  selectedInterestRate: number | null = null;


  // =========================================================
  // LOADING
  // =========================================================

  loading = false;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService
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
  // CMRC CHANGE
  // =========================================================

  onCmrcChange(): void {

    // Reset VO / ALF

    this.voAlfList = [];


    // Reset loans

    this.loansByVoAlf = {};


    // Reset records

    this.interestRecords = [];

    this.filteredInterestRecords = [];


    // Reset filters

    this.availableYears = [];

    this.availableInterestRates = [];

    this.selectedYear = null;

    this.selectedInterestRate = null;

    this.searchText = '';


    // No CMRC selected

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      return;

    }


    // Load VO / ALF

    this.loadVoAlf();

  }


  // =========================================================
  // LOAD VO / ALF
  // =========================================================

  loadVoAlf(): void {

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      return;

    }


    this.loading = true;


    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          this.loadLoans();

        },

        error: (error) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.voAlfList = [];

          this.loading = false;

        }

      });

  }


  // =========================================================
  // LOAD LOANS FOR ALL VO / ALF
  // =========================================================

  loadLoans(): void {

    this.loansByVoAlf = {};

    this.interestRecords = [];

    this.filteredInterestRecords = [];

    this.availableYears = [];

    this.availableInterestRates = [];


    if (this.voAlfList.length === 0) {

      this.loading = false;

      return;

    }


    let completedRequests = 0;


    this.voAlfList.forEach(
      (voAlf: VoAlf) => {


        // ---------------------------------------------------
        // VO / ALF ID CHECK
        // ---------------------------------------------------

        if (
          voAlf.id === undefined ||
          voAlf.id === null
        ) {

          completedRequests++;


          if (
            completedRequests ===
            this.voAlfList.length
          ) {

            this.buildInterestRecords();

          }

          return;

        }


        const voAlfId: number =
          voAlf.id;


        // ---------------------------------------------------
        // LOAD LOANS
        // ---------------------------------------------------

        this.loanService
          .getByVoAlfId(voAlfId)
          .subscribe({

            next: (loans: Loan[]) => {

              this.loansByVoAlf[voAlfId] =
                loans || [];


              completedRequests++;


              if (
                completedRequests ===
                this.voAlfList.length
              ) {

                this.buildInterestRecords();

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


              completedRequests++;


              if (
                completedRequests ===
                this.voAlfList.length
              ) {

                this.buildInterestRecords();

              }

            }

          });

      }

    );

  }


  // =========================================================
  // BUILD INTEREST RECORDS
  // =========================================================

  buildInterestRecords(): void {

    this.interestRecords = [];

    this.availableYears = [];

    this.availableInterestRates = [];


    // =======================================================
    // LOOP VO / ALF
    // =======================================================

    this.voAlfList.forEach(
      (voAlf: VoAlf) => {


        if (
          voAlf.id === undefined ||
          voAlf.id === null
        ) {

          return;

        }


        const voAlfId: number =
          voAlf.id;


        const loans: Loan[] =
          this.loansByVoAlf[voAlfId] || [];


        // ===================================================
        // VO / ALF TOTAL INTEREST
        // ===================================================

        const voAlfTotalInterest =
          loans.reduce(
            (
              total: number,
              loan: Loan
            ) => {

              return (
                total +
                this.getLoanInterest(loan)
              );

            },
            0
          );


        // ===================================================
        // WOMEN COUNT
        // ===================================================

        const womenCount =
          loans.length;


        // ===================================================
        // LOOP EACH LOAN / WOMAN
        // ===================================================

        loans.forEach(
          (loan: Loan) => {


            // ------------------------------------------------
            // FINANCIAL YEAR
            // ------------------------------------------------

            const financialYear =
              this.getLoanYear(loan);


            // ------------------------------------------------
            // INTEREST RATE
            // ------------------------------------------------

            let interestRate:
              number | null = null;


            if (
              loan.interestRate !== undefined &&
              loan.interestRate !== null
            ) {

              interestRate =
                Number(
                  loan.interestRate
                );

            }


            // ------------------------------------------------
            // AVAILABLE YEARS
            // ------------------------------------------------

            if (
              financialYear !== null &&
              !this.availableYears.includes(
                financialYear
              )
            ) {

              this.availableYears.push(
                financialYear
              );

            }


            // ------------------------------------------------
            // AVAILABLE INTEREST RATES
            // ------------------------------------------------

            if (
              interestRate !== null &&
              !this.availableInterestRates.includes(
                interestRate
              )
            ) {

              this.availableInterestRates.push(
                interestRate
              );

            }


            // ------------------------------------------------
            // CREATE RECORD
            // ------------------------------------------------

            const record:
              InterestRecord = {

              voAlfId:
                voAlfId,

              cmrcId:
                voAlf.cmrcId ?? 0,

              cmrcName:
                this.getCmrcName(
                  voAlf.cmrcId
                ),

              voAlfName:
                voAlf.voAlfName || '-',

              villageName:
                voAlf.villageName || '-',

              receivedFund:
                Number(
                  voAlf.receivedFund || 0
                ),

              loanId:
                loan.id,

              womanName:
                loan.womanName || '-',

              groupName:
                loan.groupName || '-',

              loanAmount:
                Number(
                  loan.loanAmount || 0
                ),

              loanGivenDate:
                loan.loanGivenDate,

              financialYear:
                financialYear,

              interestRate:
                interestRate,

              totalInterestReceived:
                this.getLoanInterest(
                  loan
                ),

              loanStatus:
                loan.loanStatus || '-',

              voAlfTotalInterest:
                voAlfTotalInterest,

              womenCount:
                womenCount

            };


            this.interestRecords.push(
              record
            );

          }

        );

      }

    );


    // =======================================================
    // SORT FINANCIAL YEARS
    // =======================================================

    this.availableYears.sort(
      (
        a: number,
        b: number
      ) => a - b
    );


    // =======================================================
    // SORT INTEREST RATES
    // =======================================================

    this.availableInterestRates.sort(
      (
        a: number,
        b: number
      ) => a - b
    );


    // =======================================================
    // INITIAL FILTER
    // =======================================================

    this.applyFilters();


    // =======================================================
    // LOADING COMPLETE
    // =======================================================

    this.loading = false;


    console.log(
      'Interest Records:',
      this.interestRecords
    );

  }


  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  applyFilters(): void {

    const search =
      this.searchText
        ? this.searchText
            .trim()
            .toLowerCase()
        : '';


    this.filteredInterestRecords =
      this.interestRecords.filter(
        (
          record: InterestRecord
        ) => {


          // ================================================
          // SEARCH FILTER
          // ================================================

          if (search) {

            const searchableText = [

              record.cmrcName,

              record.voAlfName,

              record.villageName,

              record.womanName,

              record.groupName,

              record.loanStatus || '',

              this.getFinancialYearLabel(
                record.financialYear
              ),

              record.interestRate !== null
                ? String(record.interestRate)
                : ''

            ]
              .join(' ')
              .toLowerCase();


            if (
              !searchableText.includes(search)
            ) {

              return false;

            }

          }


          // ================================================
          // FINANCIAL YEAR
          // ================================================

          if (
            this.selectedYear !== null &&
            Number(record.financialYear) !==
            Number(this.selectedYear)
          ) {

            return false;

          }


          // ================================================
          // INTEREST RATE
          // ================================================

          if (
            this.selectedInterestRate !== null &&
            Number(record.interestRate) !==
            Number(this.selectedInterestRate)
          ) {

            return false;

          }


          return true;

        }

      );

  }


  // =========================================================
  // YEAR FILTER
  // =========================================================

  onYearChange(): void {

    this.applyFilters();

  }


  // =========================================================
  // INTEREST RATE FILTER
  // =========================================================

  onInterestRateChange(): void {

    this.applyFilters();

  }


  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedYear = null;

    this.selectedInterestRate = null;


    this.filteredInterestRecords =
      [...this.interestRecords];

  }


  // =========================================================
  // GET CMRC NAME
  // =========================================================

  getCmrcName(
    cmrcId: number | undefined
  ): string {

    if (
      cmrcId === undefined ||
      cmrcId === null
    ) {

      return '';

    }


    const cmrc =
      this.cmrcList.find(
        c =>
          Number(c.id) ===
          Number(cmrcId)
      );


    return cmrc?.cmrcName || '';

  }


  // =========================================================
  // FINANCIAL YEAR
  // APRIL - MARCH
  // =========================================================

  getLoanYear(
    loan: Loan
  ): number | null {

    if (!loan.loanGivenDate) {

      return null;

    }


    const date =
      new Date(
        loan.loanGivenDate
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


  // =========================================================
  // FINANCIAL YEAR LABEL
  // =========================================================

  getFinancialYearLabel(
    year: number | null
  ): string {

    if (year === null) {

      return '-';

    }


    return (
      year +
      '-' +
      (year + 1)
        .toString()
        .slice(-2)
    );

  }


  // =========================================================
  // LOAN INTEREST
  // =========================================================

  getLoanInterest(
    loan: Loan
  ): number {

    return Number(
      loan.totalInterestReceived || 0
    );

  }


  // =========================================================
  // VO / ALF FILTERED TOTAL INTEREST
  // =========================================================

  getVoAlfFilteredInterest(
    voAlfId: number
  ): number {

    return this.filteredInterestRecords
      .filter(
        (
          record: InterestRecord
        ) =>
          Number(record.voAlfId) ===
          Number(voAlfId)
      )
      .reduce(
        (
          total: number,
          record: InterestRecord
        ) => {

          return (
            total +
            Number(
              record.totalInterestReceived || 0
            )
          );

        },
        0
      );

  }


  // =========================================================
  // TOTAL WOMEN
  // =========================================================

  getTotalWomen(): number {

    return this.filteredInterestRecords.length;

  }


  // =========================================================
  // TOTAL LOAN AMOUNT
  // =========================================================

  getTotalLoanAmount(): number {

    return this.filteredInterestRecords
      .reduce(
        (
          total: number,
          record: InterestRecord
        ) => {

          return (
            total +
            Number(
              record.loanAmount || 0
            )
          );

        },
        0
      );

  }


  // =========================================================
  // TOTAL INTEREST
  // =========================================================

  getTotalInterest(): number {

    return this.filteredInterestRecords
      .reduce(
        (
          total: number,
          record: InterestRecord
        ) => {

          return (
            total +
            Number(
              record.totalInterestReceived || 0
            )
          );

        },
        0
      );

  }


  // =========================================================
  // ACTIVE LOANS
  // =========================================================

  getActiveLoans(): number {

    return this.filteredInterestRecords
      .filter(
        (
          record: InterestRecord
        ) =>
          (
            record.loanStatus || ''
          ).toUpperCase() ===
          'ACTIVE'
      )
      .length;

  }


  // =========================================================
  // CLOSED LOANS
  // =========================================================

  getClosedLoans(): number {

    return this.filteredInterestRecords
      .filter(
        (
          record: InterestRecord
        ) =>
          (
            record.loanStatus || ''
          ).toUpperCase() ===
          'CLOSED'
      )
      .length;

  }


  // =========================================================
  // GROUP ROWSPAN
  // =========================================================

  getGroupRowspan(
    index: number
  ): number {

    const current =
      this.filteredInterestRecords[index];


    if (!current) {

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
        this.filteredInterestRecords[i];


      if (
        Number(next.voAlfId) ===
        Number(current.voAlfId)
      ) {

        count++;

      } else {

        break;

      }

    }


    return count;

  }


  // =========================================================
  // FIRST VO / ALF ROW
  // =========================================================

  isFirstVoAlfRow(
    index: number
  ): boolean {

    if (index === 0) {

      return true;

    }


    const current =
      this.filteredInterestRecords[index];


    const previous =
      this.filteredInterestRecords[
        index - 1
      ];


    return (
      Number(current.voAlfId) !==
      Number(previous.voAlfId)
    );

  }


  // =========================================================
  // GROUP SERIAL NUMBER
  // =========================================================

  getGroupSerialNumber(
    index: number
  ): number {

    let serialNumber = 0;


    for (
      let i = 0;
      i <= index;
      i++
    ) {

      if (
        this.isFirstVoAlfRow(i)
      ) {

        serialNumber++;

      }

    }


    return serialNumber;

  }


  // =========================================================
  // GROUP COLOR
  // =========================================================

  getGroupColorIndex(
    voAlfId: number
  ): number {

    const index =
      this.voAlfList.findIndex(
        voAlf =>
          Number(voAlf.id) ===
          Number(voAlfId)
      );


    if (index === -1) {

      return 0;

    }


    return index % 8;

  }
// =========================================================
// EXPORT INTEREST DETAILS TO EXCEL
// =========================================================

exportToExcel(): void {

  if (
    !this.filteredInterestRecords ||
    this.filteredInterestRecords.length === 0
  ) {
    alert('No interest data available to export.');
    return;
  }


  const excelData = this.filteredInterestRecords.map(
    (
      record: InterestRecord,
      index: number
    ) => {

      return {

        'Sr. No.':
          index + 1,

        'CMRC Name':
          record.cmrcName,

        'VO / ALF Name':
          record.voAlfName,

        'Village':
          record.villageName,

        'Woman Name':
          record.womanName,

        'Women Count':
          record.womenCount,

        'Group Name':
          record.groupName,

        'VO / ALF Received Amount':
          Number(record.receivedFund || 0),

        'Financial Year':
          this.getFinancialYearLabel(
            record.financialYear
          ),

        'Interest Rate':
          record.interestRate !== null
            ? record.interestRate + '%'
            : '-',

        'Loan Amount':
          Number(record.loanAmount || 0),

        'Interest Received':
          Number(
            record.totalInterestReceived || 0
          ),

        'Loan Status':
          record.loanStatus || '-',

        'VO / ALF Interest Received':
          Number(
            record.totalInterestReceived || 0
          )

      };

    }
  );


  // =======================================================
  // CREATE WORKSHEET
  // =======================================================

  const worksheet: XLSX.WorkSheet =
    XLSX.utils.json_to_sheet(
      excelData
    );


  // =======================================================
  // COLUMN WIDTH
  // =======================================================

  worksheet['!cols'] = [

    { wch: 10 },
    { wch: 22 },
    { wch: 25 },
    { wch: 20 },
    { wch: 25 },
    { wch: 14 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 25 }

  ];


  // =======================================================
  // CREATE WORKBOOK
  // =======================================================

  const workbook: XLSX.WorkBook =
    XLSX.utils.book_new();


  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Interest Details'
  );


  // =======================================================
  // FILE NAME
  // =======================================================

  const selectedCmrc =
    this.cmrcList.find(
      cmrc =>
        Number(cmrc.id) ===
        Number(this.selectedCmrcId)
    );


  const cmrcName =
    selectedCmrc?.cmrcName
      ? selectedCmrc.cmrcName
          .replace(/[^a-zA-Z0-9]/g, '_')
      : 'CMRC';


  const fileName =
    `Interest_Details_${cmrcName}.xlsx`;


  // =======================================================
  // DOWNLOAD EXCEL
  // =======================================================

  XLSX.writeFile(
    workbook,
    fileName
  );

}
}