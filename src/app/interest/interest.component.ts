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

  selectedCmrcId: number | null = null;

  voAlfList: VoAlf[] = [];

  loansByVoAlf: {
    [voAlfId: number]: Loan[];
  } = {};

  interestRecords: InterestRecord[] = [];

  filteredInterestRecords: InterestRecord[] = [];


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

        this.cmrcList = data;

      },

      error: (error) => {

        console.error(
          'CMRC API Error:',
          error
        );

      }

    });

  }


  // =========================================================
  // CMRC CHANGE
  // =========================================================

  onCmrcChange(): void {

    this.voAlfList = [];

    this.loansByVoAlf = {};

    this.interestRecords = [];

    this.filteredInterestRecords = [];

    this.availableYears = [];

    this.availableInterestRates = [];

    this.selectedYear = null;

    this.selectedInterestRate = null;


    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      return;

    }


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

          this.voAlfList = data;

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


        this.loanService
          .getByVoAlfId(voAlfId)
          .subscribe({

            next: (loans: Loan[]) => {

              this.loansByVoAlf[voAlfId] =
                loans;


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


              this.loansByVoAlf[voAlfId] = [];


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


        // =====================================================
        // VO / ALF TOTAL INTEREST
        // =====================================================

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


        // =====================================================
        // WOMEN COUNT
        // =====================================================

        const womenCount =
          loans.length;


        // =====================================================
        // EACH WOMAN / LOAN
        // =====================================================

        loans.forEach(
          (loan: Loan) => {

            const financialYear =
              this.getLoanYear(loan);


            // =================================================
            // INTEREST RATE
            // =================================================

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


            // =================================================
            // AVAILABLE FINANCIAL YEARS
            // =================================================

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


            // =================================================
            // AVAILABLE INTEREST RATES
            // =================================================

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


            // =================================================
            // CREATE RECORD
            // =================================================

            const record:
              InterestRecord = {

              voAlfId:
                voAlfId,

              cmrcId:
                voAlf.cmrcId,

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


    // =========================================================
    // SORT FILTER VALUES
    // =========================================================

    this.availableYears.sort(
      (
        a: number,
        b: number
      ) => a - b
    );


    this.availableInterestRates.sort(
      (
        a: number,
        b: number
      ) => a - b
    );


    // =========================================================
    // INITIAL FILTER
    // =========================================================

    this.filteredInterestRecords =
      [...this.interestRecords];


    this.loading = false;


    console.log(
      'Interest Records:',
      this.interestRecords
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
  // APPLY FILTERS
  // =========================================================

  applyFilters(): void {

    this.filteredInterestRecords =
      this.interestRecords.filter(
        (
          record: InterestRecord
        ) => {

          // -----------------------------------------------
          // FINANCIAL YEAR
          // -----------------------------------------------

          if (
            this.selectedYear !== null &&
            Number(record.financialYear) !==
            Number(this.selectedYear)
          ) {

            return false;

          }


          // -----------------------------------------------
          // INTEREST RATE
          // -----------------------------------------------

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
  // CLEAR FILTERS
  // =========================================================

  clearFilters(): void {

    this.selectedYear = null;

    this.selectedInterestRate = null;

    this.filteredInterestRecords =
      [...this.interestRecords];

  }


  // =========================================================
  // CMRC NAME
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
        c => c.id === cmrcId
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


    const year =
      date.getFullYear();


    const month =
      date.getMonth() + 1;


    // April to March financial year

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
          record.voAlfId === voAlfId
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
        next.voAlfId ===
        current.voAlfId
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
      current.voAlfId !==
      previous.voAlfId
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
          voAlf.id === voAlfId
      );


    if (index === -1) {

      return 0;

    }


    return index % 8;

  }

}