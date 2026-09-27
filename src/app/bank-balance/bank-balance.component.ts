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
  CmrcBalanceService,
  CmrcBalance
} from '../services/cmrc-balance.service';

import {
  LoanService,
  Loan
} from '../services/loan.service';


@Component({
  selector: 'app-bank-balance',
  templateUrl: './bank-balance.component.html',
  styleUrls: ['./bank-balance.component.css']
})
export class BankBalanceComponent implements OnInit {

  // =========================================
  // LOAN TOTALS
  // =========================================

  loanTotals: {
    [voAlfId: number]: number;
  } = {};


  monthlyLoanTotals: {
    [voAlfId: number]: {
      [month: string]: number;
    };
  } = {};


  // =========================================
  // MONTHS
  // =========================================

  allLoanMonths: string[] = [];

  loanMonths: string[] = [];


  // =========================================
  // YEARS
  // =========================================

  availableYears: number[] = [];

  selectedYear: number | null = null;


  // =========================================
  // CMRC / VO ALF
  // =========================================

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];


  // =========================================
  // CMRC BALANCE
  // =========================================

  cmrcBalance = 0;

  selectedCmrcId: number | null = null;


  // =========================================
  // LOADING
  // =========================================

  loadingVoAlf = false;

  loadingBalance = false;


  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private cmrcBalanceService: CmrcBalanceService,
    private loanService: LoanService
  ) {}


  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {

    this.loadCmrc();

  }


  // =========================================
  // LOAD CMRC
  // =========================================

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


  // =========================================
  // LOAD BANK BALANCE
  // =========================================

  loadBankBalance(): void {

    this.voAlfList = [];

    this.cmrcBalance = 0;

    this.loanTotals = {};

    this.monthlyLoanTotals = {};

    this.allLoanMonths = [];

    this.loanMonths = [];

    this.availableYears = [];

    this.selectedYear = null;


    if (!this.selectedCmrcId) {

      return;

    }


    // =======================================
    // LOAD VO / ALF
    // =======================================

    this.loadingVoAlf = true;


    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data;

          this.loadingVoAlf = false;

          this.loadLoanTotals();

        },

        error: (error) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.loadingVoAlf = false;

        }

      });


    // =======================================
    // LOAD CMRC BALANCE
    // =======================================

    this.loadingBalance = true;


    this.cmrcBalanceService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: CmrcBalance[]) => {

          if (
            data &&
            data.length > 0
          ) {

            const latestBalance =
              data[data.length - 1];

            this.cmrcBalance =
              Number(
                latestBalance.balanceAmount || 0
              );

          } else {

            this.cmrcBalance = 0;

          }


          this.loadingBalance = false;

        },

        error: (error) => {

          console.error(
            'CMRC Balance API Error:',
            error
          );

          this.cmrcBalance = 0;

          this.loadingBalance = false;

        }

      });

  }


  // =========================================
  // LOAD LOAN TOTALS
  // =========================================

  loadLoanTotals(): void {

    this.loanTotals = {};

    this.monthlyLoanTotals = {};

    this.allLoanMonths = [];

    this.loanMonths = [];

    this.availableYears = [];


    this.voAlfList.forEach(
      (voAlf: VoAlf) => {

        if (!voAlf.id) {

          return;

        }


        const voAlfId =
          voAlf.id;


        this.loanService
          .getByVoAlfId(voAlfId)
          .subscribe({

            next: (loans: Loan[]) => {

              this.monthlyLoanTotals[voAlfId] = {};


              let totalLoanAmount = 0;


              loans.forEach(
                (loan: Loan) => {

                  const loanAmount =
                    Number(
                      loan.loanAmount || 0
                    );


                  totalLoanAmount +=
                    loanAmount;


                  if (!loan.loanGivenDate) {

                    return;

                  }


                  const date =
                    new Date(
                      loan.loanGivenDate
                    );


                  const year =
                    date.getFullYear();


                  const month =
                    String(
                      date.getMonth() + 1
                    ).padStart(2, '0');


                  const monthKey =
                    `${year}-${month}`;


                  // Monthly total

                  if (
                    this.monthlyLoanTotals[
                      voAlfId
                    ][monthKey] === undefined
                  ) {

                    this.monthlyLoanTotals[
                      voAlfId
                    ][monthKey] = 0;

                  }


                  this.monthlyLoanTotals[
                    voAlfId
                  ][monthKey] += loanAmount;


                  // All months

                  if (
                    !this.allLoanMonths.includes(
                      monthKey
                    )
                  ) {

                    this.allLoanMonths.push(
                      monthKey
                    );

                  }


                  // Years

                  if (
                    !this.availableYears.includes(
                      year
                    )
                  ) {

                    this.availableYears.push(
                      year
                    );

                  }

                }

              );


              this.loanTotals[voAlfId] =
                totalLoanAmount;


              this.allLoanMonths.sort();


              this.availableYears.sort(
                (a, b) => a - b
              );


              // Latest year

              if (
                this.selectedYear === null &&
                this.availableYears.length > 0
              ) {

                this.selectedYear =
                  this.availableYears[
                    this.availableYears.length - 1
                  ];

              }


              this.updateYearMonths();

            },

            error: (error) => {

              console.error(
                'Loan API Error:',
                voAlfId,
                error
              );

              this.loanTotals[voAlfId] = 0;

              this.monthlyLoanTotals[
                voAlfId
              ] = {};

            }

          });

      }

    );

  }


  // =========================================
  // UPDATE YEAR MONTHS
  // =========================================

  updateYearMonths(): void {

    if (
      this.selectedYear === null
    ) {

      this.loanMonths = [];

      return;

    }


    this.loanMonths =
      this.allLoanMonths
        .filter(
          (month: string) => {

            const year =
              Number(
                month.substring(0, 4)
              );

            return (
              year === this.selectedYear
            );

          }
        )
        .sort();

  }


  // =========================================
  // YEAR CHANGE
  // =========================================

  onYearChange(): void {

    this.updateYearMonths();

  }


  // =========================================
  // FINANCIAL YEAR LABEL
  // =========================================

  getFinancialYearLabel(): string {

    if (
      this.selectedYear === null
    ) {

      return '';

    }


    return `${this.selectedYear}-${
      String(
        this.selectedYear + 1
      ).slice(-2)
    }`;

  }


  // =========================================
  // CMRC NAME
  // =========================================

  getSelectedCmrcName(): string {

    const cmrc =
      this.cmrcList.find(
        c =>
          c.id ===
          this.selectedCmrcId
      );


    return cmrc?.cmrcName || '';

  }


  // =========================================
  // TOTAL RECEIVED FUND
  // =========================================

  getTotalReceivedFund(): number {

    return this.voAlfList.reduce(
      (
        total: number,
        voAlf: VoAlf
      ) => {

        return (
          total +
          Number(
            voAlf.receivedFund || 0
          )
        );

      },
      0
    );

  }


  // =========================================
  // FORMAT MONTH
  // =========================================

  formatMonth(
    monthKey: string
  ): string {

    const [
      year,
      month
    ] = monthKey.split('-');


    const date =
      new Date(
        Number(year),
        Number(month) - 1,
        1
      );


    return date.toLocaleString(
      'en-US',
      {
        month: 'short',
        year: 'numeric'
      }
    );

  }


  // =========================================
  // MONTHLY LOAN AMOUNT
  // =========================================

  getMonthlyLoanAmount(
    voAlfId: number,
    month: string
  ): number {

    return Number(
      this.monthlyLoanTotals[
        voAlfId
      ]?.[month] || 0
    );

  }


  // =========================================
  // TOTAL LOAN
  // =========================================

  getTotalLoanAmountForVoAlf(
    voAlfId: number
  ): number {

    return Number(
      this.loanTotals[
        voAlfId
      ] || 0
    );

  }


  // =========================================
  // REMAINING AMOUNT
  // =========================================

  getRemainingAmount(
    voAlfId: number,
    receivedFund: number | undefined
  ): number {

    const receivedAmount =
      Number(
        receivedFund || 0
      );


    const totalLoanAmount =
      this.getTotalLoanAmountForVoAlf(
        voAlfId
      );


    return (
      receivedAmount -
      totalLoanAmount
    );

  }


  // =========================================
  // MONTHLY REMAINING
  // =========================================

  getMonthlyRemainingAmount(
    voAlfId: number,
    month: string,
    receivedFund: number | undefined
  ): number {

    let remainingAmount =
      Number(
        receivedFund || 0
      );


    for (
      const currentMonth
      of this.allLoanMonths
    ) {

      if (
        currentMonth > month
      ) {

        break;

      }


      const loanAmount =
        this.getMonthlyLoanAmount(
          voAlfId,
          currentMonth
        );


      remainingAmount -=
        loanAmount;

    }


    return remainingAmount;

  }
getTotalLoanAmount(): number {

  return this.voAlfList.reduce(
    (
      total: number,
      voAlf: VoAlf
    ) => {

      return total +
        this.getTotalLoanAmountForVoAlf(
          voAlf.id!
        );

    },
    0
  );

}


getTotalRemainingAmount(): number {

  return this.voAlfList.reduce(
    (
      total: number,
      voAlf: VoAlf
    ) => {

      return total +
        this.getRemainingAmount(
          voAlf.id!,
          voAlf.receivedFund
        );

    },
    0
  );

}
}