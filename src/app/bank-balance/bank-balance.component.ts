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
  CmrcBalanceService
} from '../services/cmrc-balance.service';

import {
  LoanService,
  Loan
} from '../services/loan.service';

import {
  GroupService,
  Group
} from '../services/group.service';

import {
  WomenService,
  Women
} from '../services/women.service';

import {
  Observable,
  forkJoin,
  firstValueFrom
} from 'rxjs';

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


  // =========================================================
  // MONTH-WISE LOAN TOTALS
  // =========================================================

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

  loadingLoans = false;


  // =========================================================
  // VO / ALF DETAILS POPUP
  // =========================================================

  showVoAlfDetailsPopup = false;

  selectedVoAlf: VoAlf | null = null;

  voAlfGroups: Group[] = [];

  voAlfWomen: Women[] = [];

  filteredVoAlfDetails: any[] = [];

  voAlfDetailsSearchText = '';

  voAlfDetailsPageSize = 10;

  voAlfDetailsCurrentPage = 1;

  voAlfDetailsLoading = false;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private cmrcBalanceService: CmrcBalanceService,
    private loanService: LoanService,
    private groupService: GroupService,
    private womenService: WomenService
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadCurrentCmrc();

  }


  // =========================================================
  // LOAD CURRENT CMRC
  // =========================================================

  loadCurrentCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        if (this.cmrcList.length === 0) {

          this.selectedCmrcId = null;

          this.voAlfList = [];

          this.cmrcBalance = 0;

          return;

        }


        const currentCmrc = this.cmrcList[0];

        if (
          currentCmrc.id !== undefined &&
          currentCmrc.id !== null
        ) {

          this.selectedCmrcId =
            Number(currentCmrc.id);

          this.loadBankBalance();

        }

      },

      error: (error: any) => {

        console.error(
          'CMRC API Error:',
          error
        );

        this.cmrcList = [];

        this.selectedCmrcId = null;

        this.voAlfList = [];

        this.cmrcBalance = 0;

      }

    });

  }


  // =========================================================
  // LOAD BANK BALANCE
  // =========================================================

  loadBankBalance(): void {

    // Close popup when CMRC changes
    this.closeVoAlfDetails();


    // -------------------------------------------------------
    // RESET
    // -------------------------------------------------------

    this.voAlfList = [];

    this.cmrcBalance = 0;

    this.loanTotals = {};

    this.monthlyLoanTotals = {};

    this.allLoanMonths = [];

    this.loanMonths = [];

    this.availableYears = [];

    this.selectedYear = null;

    this.searchText = '';


    // -------------------------------------------------------
    // VALIDATE CMRC
    // -------------------------------------------------------

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      return;

    }


    // -------------------------------------------------------
    // SELECTED CMRC
    // CMRC BALANCE = TOTAL FUND
    // -------------------------------------------------------

    const selectedCmrc = this.cmrcList.find(
      (cmrc: Cmrc) =>
        Number(cmrc.id) ===
        Number(this.selectedCmrcId)
    );


    this.cmrcBalance =
      Number(
        selectedCmrc?.totalFund || 0
      );


    // -------------------------------------------------------
    // LOAD VO / ALF
    // -------------------------------------------------------

    this.loadingVoAlf = true;

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList =
            data || [];

          this.loadingVoAlf = false;

          this.loadLoanTotals();

        },

        error: (error: any) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.voAlfList = [];

          this.loadingVoAlf = false;

        }

      });


    this.loadingBalance = false;

  }


  // =========================================================
  // LEFT CMRC BALANCE
  // =========================================================

  getLeftCmrcBalance(): number {

    const balance =
      Number(
        this.cmrcBalance || 0
      );

    const totalVoAlfReceived =
      this.getTotalReceivedFund();

    return (
      balance -
      totalVoAlfReceived
    );

  }


  // =========================================================
  // LOAD LOAN TOTALS
  // =========================================================

  async loadLoanTotals(): Promise<void> {

    this.loanTotals = {};

    this.monthlyLoanTotals = {};

    this.allLoanMonths = [];

    this.loanMonths = [];

    this.availableYears = [];

    this.loadingLoans = true;


    if (
      this.voAlfList.length === 0
    ) {

      this.finishLoanLoading();

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


    try {

      const loanLists: Loan[][] =
        await Promise.all(

          validVoAlfList.map(
            (voAlf: VoAlf) =>
              this.getLoansByVoAlfId(
                voAlf.id!
              )
          )

        );


      validVoAlfList.forEach(
        (
          voAlf: VoAlf,
          index: number
        ) => {

          const voAlfId =
            voAlf.id!;

          const loans: Loan[] =
            loanLists[index] || [];


          this.monthlyLoanTotals[
            voAlfId
          ] = {};


          let totalLoanAmount = 0;


          loans.forEach(
            (loan: Loan) => {

              const disbursedAmount =
                Number(
                  loan.sanctionedAmount || 0
                );


              totalLoanAmount +=
                disbursedAmount;


              if (
                !loan.loanGivenDate
              ) {

                return;

              }


              const date =
                this.parseDate(
                  loan.loanGivenDate
                );


              if (!date) {

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
                disbursedAmount;


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

        }
      );


      this.finishLoanLoading();

    }
    catch (error: any) {

      console.error(
        'Loan Totals Error:',
        error
      );

      this.finishLoanLoading();

    }

  }


  // =========================================================
  // GET LOANS BY VO / ALF
  // =========================================================

  private async getLoansByVoAlfId(
    voAlfId: number
  ): Promise<Loan[]> {

    try {

      const groups: Group[] =
        await firstValueFrom(
          this.groupService.getByVoAlfId(
            voAlfId
          )
        );


      if (
        !groups ||
        groups.length === 0
      ) {

        return [];

      }


      const validGroups =
        groups.filter(
          (group: Group) =>
            group.id !== undefined &&
            group.id !== null
        );


      if (
        validGroups.length === 0
      ) {

        return [];

      }


      const womenRequests:
        Observable<Women[]>[] =
        validGroups.map(
          (group: Group) =>
            this.womenService
              .getByGroupId(
                group.id!
              )
        );


      const womenLists:
        Women[][] =
        await firstValueFrom(
          forkJoin(womenRequests)
        );


      const women: Women[] =
        ([] as Women[]).concat(
          ...womenLists
        );


      if (
        women.length === 0
      ) {

        return [];

      }


      const validWomen =
        women.filter(
          (woman: Women) =>
            woman.id !== undefined &&
            woman.id !== null
        );


      if (
        validWomen.length === 0
      ) {

        return [];

      }


      const loanRequests:
        Observable<Loan[]>[] =
        validWomen.map(
          (woman: Women) =>
            this.loanService
              .getByWomanId(
                woman.id!
              )
        );


      const loanLists:
        Loan[][] =
        await firstValueFrom(
          forkJoin(loanRequests)
        );


      return ([] as Loan[]).concat(
        ...loanLists
      );

    }
    catch (error: any) {

      console.error(
        'Get Loans By VO / ALF Error:',
        voAlfId,
        error
      );

      return [];

    }

  }


  // =========================================================
  // FINISH LOAN LOADING
  // =========================================================

  finishLoanLoading(): void {

    this.allLoanMonths.sort();


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


    this.selectedYear = null;

    this.updateYearMonths();

    this.loadingLoans = false;

  }


  // =========================================================
  // UPDATE MONTHS
  // =========================================================

  updateYearMonths(): void {

    if (
      this.selectedYear === null
    ) {

      this.loanMonths =
        [...this.allLoanMonths];

      return;

    }


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


            if (
              year === startYear &&
              month >= 4
            ) {

              return true;

            }


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
  // OPEN VO / ALF DETAILS POPUP
  // =========================================================

  openVoAlfDetails(
    voAlf: VoAlf
  ): void {

    if (
      !voAlf ||
      voAlf.id === undefined ||
      voAlf.id === null
    ) {

      return;

    }


    this.selectedVoAlf = voAlf;

    this.showVoAlfDetailsPopup = true;

    this.voAlfGroups = [];

    this.voAlfWomen = [];

    this.filteredVoAlfDetails = [];

    this.voAlfDetailsSearchText = '';

    this.voAlfDetailsCurrentPage = 1;

    this.voAlfDetailsLoading = true;


    // =======================================================
    // LOAD GROUPS
    // =======================================================

    this.groupService
      .getByVoAlfId(
        voAlf.id
      )
      .subscribe({

        next: (groups: Group[]) => {

          this.voAlfGroups =
            groups || [];

          this.loadVoAlfWomenForDetails();

        },

        error: (error: any) => {

          console.error(
            'VO / ALF Group Details Error:',
            error
          );

          this.voAlfGroups = [];

          this.voAlfWomen = [];

          this.buildVoAlfDetailsList();

          this.voAlfDetailsLoading = false;

        }

      });

  }


  // =========================================================
  // LOAD WOMEN FOR SELECTED VO / ALF
  // =========================================================

  private loadVoAlfWomenForDetails(): void {

    const validGroups =
      this.voAlfGroups.filter(
        (group: Group) =>
          group.id !== undefined &&
          group.id !== null
      );


    if (
      validGroups.length === 0
    ) {

      this.voAlfWomen = [];

      this.buildVoAlfDetailsList();

      this.voAlfDetailsLoading = false;

      return;

    }


    const womenRequests:
      Observable<Women[]>[] =
      validGroups.map(
        (group: Group) =>
          this.womenService
            .getByGroupId(
              group.id!
            )
      );


    firstValueFrom(
      forkJoin(womenRequests)
    )
      .then(
        (womenLists: Women[][]) => {

          this.voAlfWomen =
            ([] as Women[]).concat(
              ...womenLists
            );


          this.buildVoAlfDetailsList();

          this.voAlfDetailsLoading = false;

        }
      )
      .catch(
        (error: any) => {

          console.error(
            'VO / ALF Women Details Error:',
            error
          );

          this.voAlfWomen = [];

          this.buildVoAlfDetailsList();

          this.voAlfDetailsLoading = false;

        }
      );

  }


  // =========================================================
  // BUILD GROUP + WOMEN DETAILS
  // =========================================================

  private buildVoAlfDetailsList(): void {

    const details: any[] = [];


    this.voAlfGroups.forEach(
      (group: Group) => {

        const groupId =
          Number(
            group.id
          );


        const groupWomen =
          this.voAlfWomen.filter(
            (woman: Women) =>
              Number(
                (woman as any).groupId
              ) === groupId
          );


        if (
          groupWomen.length === 0
        ) {

          details.push({

            group: group,

            woman: null

          });

          return;

        }


        groupWomen.forEach(
          (woman: Women) => {

            details.push({

              group: group,

              woman: woman

            });

          }
        );

      }
    );


    this.filteredVoAlfDetails =
      details;

    this.applyVoAlfDetailsFilter();

  }


  // =========================================================
  // COMMON FILTER
  // =========================================================

  applyVoAlfDetailsFilter(): void {

    const search =
      (this.voAlfDetailsSearchText || '')
        .trim()
        .toLowerCase();


    const allRows =
      this.getAllVoAlfDetailsRows();


    if (!search) {

      this.filteredVoAlfDetails =
        allRows;

    } else {

      this.filteredVoAlfDetails =
        allRows.filter(
          (row: any) => {

            const group =
              row.group || {};

            const woman =
              row.woman || {};


            const groupName =
              String(
                (group as any).groupName ||
                (group as any).name ||
                ''
              ).toLowerCase();


            const womanName =
              String(
                (woman as any).womanName ||
                ''
              ).toLowerCase();


            const husbandName =
              String(
                (woman as any).husbandName ||
                ''
              ).toLowerCase();


            const mobileNo =
              String(
                (woman as any).mobileNo ||
                ''
              ).toLowerCase();


            const address =
              String(
                (woman as any).address ||
                ''
              ).toLowerCase();


            const status =
              String(
                (woman as any).status ||
                ''
              ).toLowerCase();


            return (
              groupName.includes(search) ||
              womanName.includes(search) ||
              husbandName.includes(search) ||
              mobileNo.includes(search) ||
              address.includes(search) ||
              status.includes(search)
            );

          }
        );

    }


    this.voAlfDetailsCurrentPage = 1;

  }


  // =========================================================
  // GET ALL DETAILS ROWS
  // =========================================================

  private getAllVoAlfDetailsRows(): any[] {

    const details: any[] = [];


    this.voAlfGroups.forEach(
      (group: Group) => {

        const groupId =
          Number(
            group.id
          );


        const groupWomen =
          this.voAlfWomen.filter(
            (woman: Women) =>
              Number(
                (woman as any).groupId
              ) === groupId
          );


        if (
          groupWomen.length === 0
        ) {

          details.push({

            group: group,

            woman: null

          });

        } else {

          groupWomen.forEach(
            (woman: Women) => {

              details.push({

                group: group,

                woman: woman

              });

            }
          );

        }

      }
    );


    return details;

  }


  // =========================================================
  // DETAILS TOTAL PAGES
  // =========================================================

  getVoAlfDetailsTotalPages(): number {

    if (
      this.filteredVoAlfDetails.length === 0
    ) {

      return 1;

    }


    return Math.ceil(
      this.filteredVoAlfDetails.length /
      this.voAlfDetailsPageSize
    );

  }


  // =========================================================
  // PAGINATED DETAILS
  // =========================================================

  getPaginatedVoAlfDetails(): any[] {

    const start =
      (
        this.voAlfDetailsCurrentPage - 1
      ) *
      this.voAlfDetailsPageSize;


    const end =
      start +
      this.voAlfDetailsPageSize;


    return this.filteredVoAlfDetails.slice(
      start,
      end
    );

  }


  // =========================================================
  // DETAILS PAGE NUMBERS
  // =========================================================

  getVoAlfDetailsPages(): number[] {

    const totalPages =
      this.getVoAlfDetailsTotalPages();


    return Array.from(
      {
        length: totalPages
      },
      (
        _: unknown,
        index: number
      ) => index + 1
    );

  }


  // =========================================================
  // GO TO DETAILS PAGE
  // =========================================================

  goToVoAlfDetailsPage(
    page: number
  ): void {

    const totalPages =
      this.getVoAlfDetailsTotalPages();


    if (
      page < 1 ||
      page > totalPages
    ) {

      return;

    }


    this.voAlfDetailsCurrentPage =
      page;

  }


  // =========================================================
  // PREVIOUS DETAILS PAGE
  // =========================================================

  previousVoAlfDetailsPage(): void {

    if (
      this.voAlfDetailsCurrentPage > 1
    ) {

      this.voAlfDetailsCurrentPage--;

    }

  }


  // =========================================================
  // NEXT DETAILS PAGE
  // =========================================================

  nextVoAlfDetailsPage(): void {

    const totalPages =
      this.getVoAlfDetailsTotalPages();


    if (
      this.voAlfDetailsCurrentPage <
      totalPages
    ) {

      this.voAlfDetailsCurrentPage++;

    }

  }


  // =========================================================
  // PAGE SIZE CHANGE
  // =========================================================

  onVoAlfDetailsPageSizeChange(): void {

    this.voAlfDetailsCurrentPage = 1;

  }


  // =========================================================
  // CLOSE DETAILS POPUP
  // =========================================================

  closeVoAlfDetails(): void {

    this.showVoAlfDetailsPopup = false;

    this.selectedVoAlf = null;

    this.voAlfGroups = [];

    this.voAlfWomen = [];

    this.filteredVoAlfDetails = [];

    this.voAlfDetailsSearchText = '';

    this.voAlfDetailsCurrentPage = 1;

    this.voAlfDetailsLoading = false;

  }


  // =========================================================
  // GROUP NAME
  // =========================================================

  getGroupName(
    group: Group | null
  ): string {

    if (!group) {

      return '-';

    }


    return String(
      (group as any).groupName ||
      (group as any).name ||
      '-'
    );

  }


  // =========================================================
  // WOMAN NAME
  // =========================================================

  getWomanName(
    woman: Women | null
  ): string {

    if (!woman) {

      return '-';

    }


    return String(
      (woman as any).womanName ||
      '-'
    );

  }


  // =========================================================
  // HUSBAND NAME
  // =========================================================

  getHusbandName(
    woman: Women | null
  ): string {

    if (!woman) {

      return '-';

    }


    return String(
      (woman as any).husbandName ||
      '-'
    );

  }


  // =========================================================
  // WOMAN MOBILE
  // =========================================================

  getWomanMobile(
    woman: Women | null
  ): string {

    if (!woman) {

      return '-';

    }


    return String(
      (woman as any).mobileNo ||
      '-'
    );

  }


  // =========================================================
  // WOMAN STATUS
  // =========================================================

  getWomanStatus(
    woman: Women | null
  ): string {

    if (!woman) {

      return '-';

    }


    return String(
      (woman as any).status ||
      '-'
    );

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


    const worksheet:
      XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(
        excelData
      );


    const columnWidths: {
      wch: number;
    }[] = [

      { wch: 10 },

      { wch: 30 },

      { wch: 20 },

      { wch: 28 },

      { wch: 18 }

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


    const workbook:
      XLSX.WorkBook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Bank Balance'
    );


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
getVoAlfDetailsShowingTo(): number {

if (this.filteredVoAlfDetails.length === 0) {
return 0;
}

return Math.min(
this.voAlfDetailsCurrentPage *
this.voAlfDetailsPageSize,
this.filteredVoAlfDetails.length
);

}

}
