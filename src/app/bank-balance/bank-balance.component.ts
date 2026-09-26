import { Component, OnInit } from '@angular/core';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';

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

  // ==========================================
  // Loan Totals
  // ==========================================

  loanTotals: {
    [voAlfId: number]: number;
  } = {};


  // ==========================================
  // Dynamic Monthly Loan Data
  // ==========================================

  loanMonths: string[] = [];

  monthlyLoanTotals: {
    [voAlfId: number]: {
      [month: string]: number;
    };
  } = {};


  // ==========================================
  // CMRC / VO ALF Data
  // ==========================================

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];
fullyRepaidLoans: any[] = [];

cmrcBalance = 0;

  // ==========================================
  // CMRC Balance
  // ==========================================



  // ==========================================
  // Selected CMRC
  // ==========================================

  selectedCmrcId: number | null = null;


  // ==========================================
  // Loading
  // ==========================================

  loadingVoAlf = false;

  loadingBalance = false;


  // ==========================================
  // Constructor
  // ==========================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private cmrcBalanceService: CmrcBalanceService,
    private loanService: LoanService
  ) {}


  // ==========================================
  // On Init
  // ==========================================

  ngOnInit(): void {

    this.loadCmrc();

  }


  // ==========================================
  // Load CMRC
  // ==========================================

  loadCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data) => {

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


  // ==========================================
  // CMRC Selection
  // ==========================================

  loadBankBalance(): void {

    // Reset old data
    this.voAlfList = [];

    this.cmrcBalance = 0;

    this.loanTotals = {};

    this.loanMonths = [];

    this.monthlyLoanTotals = {};


    // No CMRC selected
    if (!this.selectedCmrcId) {

      return;

    }


    // ========================================
    // API 1 - VO / ALF
    // ========================================

    this.loadingVoAlf = true;


    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data) => {

          this.voAlfList = data;

          this.loadingVoAlf = false;


          console.log(
            'VO / ALF Data:',
            this.voAlfList
          );


          // Load loans for every VO / ALF
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


    // ========================================
    // API 2 - CMRC Balance
    // ========================================

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

          this.loadingBalance = false;

        }

      });

  }


  // ==========================================
  // Load Loans for Every VO / ALF
  // ==========================================

  loadLoanTotals(): void {

    this.loanTotals = {};

    this.monthlyLoanTotals = {};

    this.loanMonths = [];


    this.voAlfList.forEach(voAlf => {

      if (!voAlf.id) {

        return;

      }


      // ======================================
      // Loan API
      // ======================================

      this.loanService
        .getByVoAlfId(voAlf.id)
        .subscribe({

          next: (loans: Loan[]) => {


            // ==================================
            // Total Loan Amount
            // ==================================

            const totalLoanAmount =
              loans.reduce(

                (total, loan) =>

                  total +
                  Number(
                    loan.loanAmount || 0
                  ),

                0

              );


            this.loanTotals[voAlf.id!] =
              totalLoanAmount;


            // ==================================
            // Initialize Monthly Data
            // ==================================

            this.monthlyLoanTotals[
              voAlf.id!
            ] = {};


            // ==================================
            // Process Every Loan
            // ==================================

            loans.forEach(loan => {


              // No loan date
              if (!loan.loanGivenDate) {

                return;

              }


              // =================================
              // Get Month from loanGivenDate
              // =================================

              const date =
                new Date(
                  loan.loanGivenDate
                );


              const monthKey =
                date.getFullYear() +
                '-' +
                String(
                  date.getMonth() + 1
                ).padStart(2, '0');


              // =================================
              // Initialize Month
              // =================================

              if (
                !this.monthlyLoanTotals[
                  voAlf.id!
                ][monthKey]
              ) {

                this.monthlyLoanTotals[
                  voAlf.id!
                ][monthKey] = 0;

              }


              // =================================
              // Add Loan Amount
              // =================================

              this.monthlyLoanTotals[
                voAlf.id!
              ][monthKey] +=
                Number(
                  loan.loanAmount || 0
                );


              // =================================
              // Add Dynamic Month
              // =================================

              if (
                !this.loanMonths.includes(
                  monthKey
                )
              ) {

                this.loanMonths.push(
                  monthKey
                );

              }

            });


            // ==================================
            // Sort Months
            // ==================================

            this.loanMonths.sort();


            // ==================================
            // Console
            // ==================================

            console.log(
              'VO / ALF:',
              voAlf.voAlfName
            );


            console.log(
              'Total Loan:',
              totalLoanAmount
            );


            console.log(
              'Monthly Loans:',
              this.monthlyLoanTotals[
                voAlf.id!
              ]
            );


            console.log(
              'All Loan Months:',
              this.loanMonths
            );

          },


          error: (error) => {

            console.error(
              'Loan API Error for VO / ALF:',
              voAlf.id,
              error
            );


            this.loanTotals[
              voAlf.id!
            ] = 0;


            this.monthlyLoanTotals[
              voAlf.id!
            ] = {};

          }

        });

    });

  }


  // ==========================================
  // Selected CMRC Name
  // ==========================================

  getSelectedCmrcName(): string {

    const cmrc =
      this.cmrcList.find(
        c =>
          c.id ===
          this.selectedCmrcId
      );


    return cmrc?.cmrcName || '';

  }


  // ==========================================
  // Total VO / ALF Received Fund
  // ==========================================

  getTotalReceivedFund(): number {

    return this.voAlfList.reduce(

      (total, voAlf) =>

        total +
        Number(
          voAlf.receivedFund || 0
        ),

      0

    );

  }


  // ==========================================
  // Format Month
  // Example: 2026-09 → Sep 2026
  // ==========================================

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


  // ==========================================
  // Get Monthly Loan Amount
  // ==========================================

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
  getTotalLoanAmountForVoAlf(voAlfId: number): number {

  return this.loanMonths.reduce(
    (total, month) =>
      total + this.getMonthlyLoanAmount(voAlfId, month),
    0
  );

}
getRemainingAmount(
  voAlfId: number,
  receivedFund: number | undefined
): number {

  const receivedAmount =
    Number(receivedFund || 0);

  const totalLoanAmount =
    this.getTotalLoanAmountForVoAlf(voAlfId);

  return receivedAmount - totalLoanAmount;

}
getMonthlyRemainingAmount(
  voAlfId: number,
  month: string,
  receivedFund: number | undefined
): number {

  let remainingAmount = Number(receivedFund || 0);

  for (const currentMonth of this.loanMonths) {

    const currentValue =
      this.getMonthlyLoanAmount(
        voAlfId,
        currentMonth
      );

    // If current month loan is 0,
    // keep previous balance unchanged
    if (currentValue === 0) {

      remainingAmount = remainingAmount;

    } else {

      remainingAmount =
        remainingAmount - currentValue;
    }

    // Stop when required month is reached
    if (currentMonth === month) {
      break;
    }
  }

  return remainingAmount;
}

closedLoanData: {
  [voAlfId: number]: {
    [month: string]: {
      count: number;
      interest: number;
    };
  };
} = {};

}