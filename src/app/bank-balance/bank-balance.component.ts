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

import * as XLSX from 'xlsx';


@Component({
  selector: 'app-bank-balance',
  templateUrl: './bank-balance.component.html',
  styleUrls: ['./bank-balance.component.css']
})
export class BankBalanceComponent implements OnInit {

  // =========================================================
  // LOAN TOTALS
  // =========================================================

  loanTotals: {
    [voAlfId: number]: number;
  } = {};

  // Month-wise loan expense
  monthlyLoanTotals: {
    [voAlfId: number]: {
      [month: string]: number;
    };
  } = {};

  // =========================================================
  // MONTHS
  // =========================================================

  allLoanMonths: string[] = [];

  loanMonths: string[] = [];

  // =========================================================
  // FINANCIAL YEAR
  // =========================================================

  availableYears: number[] = [];

  /**
   * null = All
   *
   * Example:
   * 2025 = Financial Year 2025-26
   */
  selectedYear: number | null = null;

  // =========================================================
  // SEARCH
  // =========================================================

  searchText = '';

  // =========================================================
  // CMRC / VO ALF
  // =========================================================

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  // =========================================================
  // CMRC BALANCE
  // =========================================================

  cmrcBalance = 0;

  selectedCmrcId: number | null = null;

  // =========================================================
  // LOADING
  // =========================================================

  loadingVoAlf = false;

  loadingBalance = false;

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private cmrcBalanceService: CmrcBalanceService,
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
  // LOAD BANK BALANCE
  // =========================================================

  loadBankBalance(): void {

    this.voAlfList = [];

    this.cmrcBalance = 0;

    this.loanTotals = {};

    this.monthlyLoanTotals = {};

    this.allLoanMonths = [];

    this.loanMonths = [];

    this.availableYears = [];

    this.selectedYear = null;

    this.searchText = '';

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {
      return;
    }

    // -------------------------------------------------------
    // LOAD VO / ALF
    // -------------------------------------------------------

    this.loadingVoAlf = true;

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          this.loadingVoAlf = false;

          this.loadLoanTotals();
        },

        error: (error) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.voAlfList = [];

          this.loadingVoAlf = false;
        }

      });

    // -------------------------------------------------------
    // LOAD CMRC BALANCE
    // -------------------------------------------------------

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

  // =========================================================
  // LOAD LOAN TOTALS
  // =========================================================

  loadLoanTotals(): void {

    this.loanTotals = {};

    this.monthlyLoanTotals = {};

    this.allLoanMonths = [];

    this.loanMonths = [];

    this.availableYears = [];

    if (
      this.voAlfList.length === 0
    ) {
      return;
    }

    const validVoAlfList =
      this.voAlfList.filter(
        (voAlf: VoAlf) =>
          voAlf.id !== undefined &&
          voAlf.id !== null
      );

    if (
      validVoAlfList.length === 0
    ) {
      this.finishLoanLoading();
      return;
    }

    let completedRequests = 0;

    const totalRequests =
      validVoAlfList.length;

    validVoAlfList.forEach(
      (voAlf: VoAlf) => {

        const voAlfId =
          voAlf.id!;

        this.loanService
          .getByVoAlfId(voAlfId)
          .subscribe({

            next: (loans: Loan[]) => {

              this.monthlyLoanTotals[
                voAlfId
              ] = {};

              let totalLoanAmount = 0;

              (loans || []).forEach(
                (loan: Loan) => {

                 const sanctionedAmount =
  Number(
    loan.sanctionedAmount || 0
  );

totalLoanAmount +=
  sanctionedAmount;

                  // -----------------------------------------
                  // LOAN DATE
                  // -----------------------------------------

                  if (
                    !loan.loanGivenDate
                  ) {
                    return;
                  }

                  const date =
                    this.parseDate(
                      loan.loanGivenDate
                    );

                  if (
                    !date
                  ) {
                    return;
                  }

                  const year =
                    date.getFullYear();

                  const month =
                    String(
                      date.getMonth() + 1
                    ).padStart(2, '0');

                  const monthKey =
                    `${year}-${month}`;

                  // -----------------------------------------
                  // MONTHLY LOAN EXPENSE
                  // -----------------------------------------

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
                  ][monthKey] +=
                    sanctionedAmount;

                  // -----------------------------------------
                  // ALL MONTHS
                  // -----------------------------------------

                  if (
                    !this.allLoanMonths.includes(
                      monthKey
                    )
                  ) {

                    this.allLoanMonths.push(
                      monthKey
                    );
                  }

                }
              );

              this.loanTotals[
                voAlfId
              ] = totalLoanAmount;

              completedRequests++;

              if (
                completedRequests ===
                totalRequests
              ) {

                this.finishLoanLoading();
              }

            },

            error: (error) => {

              console.error(
                'Loan API Error:',
                voAlfId,
                error
              );

              this.loanTotals[
                voAlfId
              ] = 0;

              this.monthlyLoanTotals[
                voAlfId
              ] = {};

              completedRequests++;

              if (
                completedRequests ===
                totalRequests
              ) {

                this.finishLoanLoading();
              }
            }

          });
      }
    );
  }

  // =========================================================
  // FINISH LOAN LOADING
  // =========================================================

  finishLoanLoading(): void {

    // Sort YYYY-MM
    this.allLoanMonths.sort();

    // -----------------------------------------
    // CREATE FINANCIAL YEARS
    // -----------------------------------------

    const yearSet =
      new Set<number>();

    this.allLoanMonths.forEach(
      (monthKey: string) => {

        const [
          yearText,
          monthText
        ] =
          monthKey.split('-');

        const year =
          Number(yearText);

        const month =
          Number(monthText);

        /**
         * Apr-Dec
         * Financial Year starts in same year
         *
         * Jan-Mar
         * Financial Year starts previous year
         */

        const financialYearStart =
          month >= 4
            ? year
            : year - 1;

        yearSet.add(
          financialYearStart
        );
      }
    );

    this.availableYears =
      Array.from(yearSet)
        .sort(
          (
            a: number,
            b: number
          ) => a - b
        );

    // -----------------------------------------
    // DEFAULT = ALL
    // -----------------------------------------

    this.selectedYear = null;

    this.updateYearMonths();
  }

  // =========================================================
  // UPDATE MONTHS
  // =========================================================

  updateYearMonths(): void {

    // -------------------------------------------------------
    // ALL
    // -------------------------------------------------------

    if (
      this.selectedYear === null
    ) {

      this.loanMonths =
        [...this.allLoanMonths];

      return;
    }

    // -------------------------------------------------------
    // SELECTED FINANCIAL YEAR
    // -------------------------------------------------------

    const startYear =
      this.selectedYear;

    const endYear =
      startYear + 1;

    this.loanMonths =
      this.allLoanMonths
        .filter(
          (monthKey: string) => {

            const [
              yearText,
              monthText
            ] =
              monthKey.split('-');

            const year =
              Number(yearText);

            const month =
              Number(monthText);

            // Apr-Dec of start year
            if (
              year === startYear &&
              month >= 4
            ) {

              return true;
            }

            // Jan-Mar of next year
            if (
              year === endYear &&
              month <= 3
            ) {

              return true;
            }

            return false;
          }
        )
        .sort();
  }

  // =========================================================
  // YEAR CHANGE
  // =========================================================

  onYearChange(): void {

    this.updateYearMonths();
  }

  // =========================================================
  // FINANCIAL YEAR LABEL
  // =========================================================

  getFinancialYearLabel(): string {

    if (
      this.selectedYear === null
    ) {

      return 'All';
    }

    return `${this.selectedYear}-${String(
      this.selectedYear + 1
    ).slice(-2)}`;
  }

  // =========================================================
  // SELECTED CMRC NAME
  // =========================================================

  getSelectedCmrcName(): string {

    const cmrc =
      this.cmrcList.find(
        (c: Cmrc) =>
          Number(c.id) ===
          Number(this.selectedCmrcId)
      );

    return cmrc?.cmrcName || '';
  }

  // =========================================================
  // SEARCH
  // =========================================================

  getFilteredVoAlfList(): VoAlf[] {

    const search =
      (this.searchText || '')
        .trim()
        .toLowerCase();

    if (!search) {
      return this.voAlfList;
    }

    return this.voAlfList.filter(
      (voAlf: VoAlf) => {

        const voAlfName =
          String(
            voAlf.voAlfName || ''
          ).toLowerCase();

        const villageName =
          String(
            voAlf.villageName || ''
          ).toLowerCase();

        return (
          voAlfName.includes(search) ||
          villageName.includes(search)
        );
      }
    );
  }

  // =========================================================
  // TOTAL RECEIVED FUND
  // =========================================================

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

  // =========================================================
  // MONTH FORMAT
  // =========================================================

  formatMonth(
    monthKey: string
  ): string {

    const [
      year,
      month
    ] =
      monthKey.split('-');

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
        year: '2-digit'
      }
    );
  }

  // =========================================================
  // GET MONTHLY LOAN EXPENSE
  // =========================================================

  getMonthlyLoanExpense(
    voAlfId: number,
    month: string
  ): number {

    return Number(
      this.monthlyLoanTotals[
        voAlfId
      ]?.[month] || 0
    );
  }

  // =========================================================
  // GET CUMULATIVE LOAN EXPENSE
  // =========================================================

  getCumulativeLoanExpense(
    voAlfId: number,
    month: string
  ): number {

    let totalExpense = 0;

    for (
      const currentMonth
      of this.allLoanMonths
    ) {

      if (
        currentMonth > month
      ) {
        break;
      }

      totalExpense +=
        this.getMonthlyLoanExpense(
          voAlfId,
          currentMonth
        );
    }

    return totalExpense;
  }

  // =========================================================
  // GET MONTHLY REMAINING AMOUNT
  // =========================================================

  getMonthlyRemainingAmount(
    voAlfId: number,
    month: string,
    receivedFund: number | undefined
  ): number {

    const receivedAmount =
      Number(
        receivedFund || 0
      );

    const cumulativeExpense =
      this.getCumulativeLoanExpense(
        voAlfId,
        month
      );

    return (
      receivedAmount -
      cumulativeExpense
    );
  }

  // =========================================================
  // TOTAL LOAN AMOUNT FOR VO / ALF
  // =========================================================

  getTotalLoanAmountForVoAlf(
    voAlfId: number
  ): number {

    return Number(
      this.loanTotals[
        voAlfId
      ] || 0
    );
  }

  // =========================================================
  // CURRENT BALANCE
  // =========================================================

  getCurrentBalance(
    voAlf: VoAlf
  ): number {

    if (
      !voAlf.id
    ) {
      return Number(
        voAlf.receivedFund || 0
      );
    }

    if (
      this.allLoanMonths.length === 0
    ) {

      return Number(
        voAlf.receivedFund || 0
      );
    }

    const latestMonth =
      this.allLoanMonths[
        this.allLoanMonths.length - 1
      ];

    return this.getMonthlyRemainingAmount(
      voAlf.id,
      latestMonth,
      voAlf.receivedFund
    );
  }

  // =========================================================
  // CURRENT BALANCE FOR SELECTED FINANCIAL YEAR
  // =========================================================

  getSelectedPeriodCurrentBalance(
    voAlf: VoAlf
  ): number {

    if (
      !voAlf.id
    ) {
      return Number(
        voAlf.receivedFund || 0
      );
    }

    if (
      this.loanMonths.length === 0
    ) {

      return Number(
        voAlf.receivedFund || 0
      );
    }

    const latestMonth =
      this.loanMonths[
        this.loanMonths.length - 1
      ];

    return this.getMonthlyRemainingAmount(
      voAlf.id,
      latestMonth,
      voAlf.receivedFund
    );
  }

  // =========================================================
  // TOTAL LOAN AMOUNT
  // =========================================================

  getTotalLoanAmount(): number {

    return this.voAlfList.reduce(
      (
        total: number,
        voAlf: VoAlf
      ) => {

        return (
          total +
          this.getTotalLoanAmountForVoAlf(
            voAlf.id!
          )
        );
      },
      0
    );
  }

  // =========================================================
  // TOTAL CURRENT BALANCE
  // =========================================================

  getTotalCurrentBalance(): number {

    return this.voAlfList.reduce(
      (
        total: number,
        voAlf: VoAlf
      ) => {

        return (
          total +
          this.getSelectedPeriodCurrentBalance(
            voAlf
          )
        );
      },
      0
    );
  }

  // =========================================================
  // UTILIZATION %
  // =========================================================

  getUtilizationPercentage(): number {

    const received =
      this.getTotalReceivedFund();

    const loanAmount =
      this.getTotalLoanAmount();

    if (
      received <= 0
    ) {

      return 0;
    }

    return (
      (loanAmount / received) *
      100
    );
  }

  // =========================================================
  // TOTAL MONTHLY REMAINING
  // =========================================================

  getTotalMonthlyRemaining(
    month: string
  ): number {

    return this.voAlfList.reduce(
      (
        total: number,
        voAlf: VoAlf
      ) => {

        return (
          total +
          this.getMonthlyRemainingAmount(
            voAlf.id!,
            month,
            voAlf.receivedFund
          )
        );
      },
      0
    );
  }

  // =========================================================
  // TOTAL MONTHLY LOAN EXPENSE
  // =========================================================

  getTotalMonthlyLoanExpense(
    month: string
  ): number {

    return this.voAlfList.reduce(
      (
        total: number,
        voAlf: VoAlf
      ) => {

        return (
          total +
          this.getMonthlyLoanExpense(
            voAlf.id!,
            month
          )
        );
      },
      0
    );
  }

  // =========================================================
  // DATE PARSER
  // =========================================================

  private parseDate(
    value: any
  ): Date | null {

    if (!value) {
      return null;
    }

    // Date object
    if (
      value instanceof Date
    ) {

      if (
        isNaN(
          value.getTime()
        )
      ) {
        return null;
      }

      return value;
    }

    const valueString =
      String(value);

    // yyyy-MM-dd
    const match =
      valueString.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (match) {

      const year =
        Number(match[1]);

      const month =
        Number(match[2]);

      const day =
        Number(match[3]);

      const date =
        new Date(
          year,
          month - 1,
          day
        );

      if (
        isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      return date;
    }

    const date =
      new Date(valueString);

    if (
      isNaN(
        date.getTime()
      )
    ) {

      return null;
    }

    return date;
  }

  // =========================================================
  // EXPORT TO EXCEL
  // =========================================================

  exportToExcel(): void {

    if (
      !this.selectedCmrcId ||
      this.voAlfList.length === 0
    ) {

      alert(
        'No bank balance data available to export.'
      );

      return;
    }

    const excelData: any[] = [];

    this.voAlfList.forEach(
      (
        voAlf: VoAlf,
        index: number
      ) => {

        const row: any = {

          'Sr. No.':
            index + 1,

          'CMRC':
            this.getSelectedCmrcName() || '-',

          'Village':
            voAlf.villageName || '-',

          'VO / ALF':
            voAlf.voAlfName || '-',

          'Received Fund':
            Number(
              voAlf.receivedFund || 0
            )
        };

        // -----------------------------------------
        // MONTHLY REMAINING
        // -----------------------------------------

        this.loanMonths.forEach(
          (
            month: string
          ) => {

            row[
              this.formatMonth(month)
            ] =
              this.getMonthlyRemainingAmount(
                voAlf.id!,
                month,
                voAlf.receivedFund
              );
          }
        );

        // -----------------------------------------
        // ADDITIONAL DATA
        // -----------------------------------------

        row[
          'Total Loan Disbursed'
        ] =
          this.getTotalLoanAmountForVoAlf(
            voAlf.id!
          );

        row[
          'Current Balance'
        ] =
          this.getSelectedPeriodCurrentBalance(
            voAlf
          );

        excelData.push(row);
      }
    );

    // =======================================================
    // WORKSHEET
    // =======================================================

    const worksheet:
      XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    // =======================================================
    // COLUMN WIDTH
    // =======================================================

    const columnWidths: {
      wch: number;
    }[] = [

      { wch: 10 },  // Sr No
      { wch: 30 },  // CMRC
      { wch: 20 },  // Village
      { wch: 28 },  // VO/ALF
      { wch: 18 }   // Received Fund
    ];

    this.loanMonths.forEach(
      () => {

        columnWidths.push({
          wch: 16
        });
      }
    );

    columnWidths.push(
      { wch: 22 },
      { wch: 20 }
    );

    worksheet['!cols'] =
      columnWidths;

    // =======================================================
    // WORKBOOK
    // =======================================================

    const workbook:
      XLSX.WorkBook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Bank Balance'
    );

    // =======================================================
    // FILE NAME
    // =======================================================

    const cmrcName =
      this.getSelectedCmrcName()
        .replace(
          /[^a-zA-Z0-9]/g,
          '_'
        );

    const financialYear =
      this.getFinancialYearLabel()
        .replace(
          /[^a-zA-Z0-9-]/g,
          ''
        );

    const fileName =
      `Bank_Balance_${cmrcName}_${financialYear}.xlsx`;

    XLSX.writeFile(
      workbook,
      fileName
    );
  }

}