import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';

import { CmrcService } from '../services/cmrc.service';
import { VoAlfService } from '../services/vo-alf.service';
import { LoanService } from '../services/loan.service';
import { ClScheduleService } from '../services/cl-schedule.service';
import { RepaymentService } from '../services/repayment.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // =====================================================
  // FILTERS
  // =====================================================

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;

  cmrcList: any[] = [];
  voAlfList: any[] = [];

  loanList: any[] = [];
  allLoanList: any[] = [];

  recentLoans: any[] = [];
  bankBalanceList: any[] = [];

  selectedVoAlf: any = null;

  // =====================================================
  // BALANCE SUMMARY
  // =====================================================

  totalCmrcBalance = 0;
  totalAlfBalance = 0;
  leftAlfBalance = 0;
  leftCmrcBalance = 0;

  // =====================================================
  // OVERALL SUMMARY
  // =====================================================

  totalCmrc = 0;
  totalVoAlf = 0;
  totalLoans = 0;
  activeLoans = 0;
  closedLoans = 0;
  totalWomen = 0;
  totalLoanAmount = 0;

  // =====================================================
  // VO / ALF DETAILS
  // =====================================================

  ultraPoorReceivedFund = 0;
  debtTrappedReceivedFund = 0;
  totalReceivedFund = 0;

  ultraPoorGroupCount = 0;
  debtTrappedGroupCount = 0;
  totalGroups = 0;

  ultraPoorWomenCount = 0;
  debtTrappedWomenCount = 0;

  ultraPoorGroupAmount = 0;
  debtTrappedGroupAmount = 0;
  totalGroupAmount = 0;

  ultraPoorWomenAmount = 0;
  debtTrappedWomenAmount = 0;
  totalWomenAmount = 0;

  // =====================================================
  // CL / REPAYMENT SUMMARY
  // =====================================================

  totalScheduledEmi = 0;
  totalPaidAmount = 0;
  totalOutstandingAmount = 0;
  totalPenalty = 0;

  totalInstallments = 0;
  paidInstallments = 0;
  partialInstallments = 0;
  pendingInstallments = 0;

  partialAmount = 0;
  regularRepayments = 0;
  irregularRepayments = 0;

  allRepaymentList: any[] = [];

  // =====================================================
  // UI
  // =====================================================

  activeTab = 'fund';

  recentActivities: any[] = [];

  // =====================================================
  // CHART COLORS
  // =====================================================

  chartColors: string[] = [
    '#d4af37',
    '#4e73df',
    '#20a779',
    '#e76f51',
    '#8e6bbf',
    '#6c757d',
    '#f4a261',
    '#2a9d8f',
    '#e63946',
    '#457b9d'
  ];

  // =====================================================
  // REPAYMENT PURPOSE CHART
  // =====================================================

  repaymentPurposeChartData: any[] = [];

  repaymentChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 8
      }
    ]
  };

  repaymentChartOptions: ChartConfiguration<'doughnut'>['options'] = {

    responsive: true,

    maintainAspectRatio: false,

    cutout: '68%',

    plugins: {

      legend: {
        display: false
      },

      tooltip: {

        callbacks: {

          label: (context: any) => {

            const value = Number(
              context.raw || 0
            );

            return ' ₹' +
              value.toLocaleString('en-IN');
          }
        }
      }
    }
  };

  // =====================================================
  // MONTHLY LOAN DISBURSEMENT CHART
  // =====================================================

  monthlyLoanChartData: ChartData<'line'> = {

    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ],

    datasets: [
      {
        label: 'Loan Disbursement',

        data: [],

        borderColor: '#d4af37',

        backgroundColor:
          'rgba(212, 175, 55, 0.15)',

        fill: true,

        tension: 0.4,

        pointRadius: 5,

        pointHoverRadius: 7
      }
    ]
  };

  monthlyLoanChartOptions:
    ChartConfiguration<'line'>['options'] = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

      legend: {
        display: false
      },

      tooltip: {

        callbacks: {

          label: (context: any) => {

            const value = Number(
              context.raw || 0
            );

            return ' ₹' +
              value.toLocaleString('en-IN');
          }
        }
      }
    },

    scales: {

      x: {

        grid: {
          display: false
        }
      },

      y: {

        beginAtZero: true,

        ticks: {

          callback: (value: any) => {

            const amount =
              Number(value);

            if (amount >= 100000) {

              return '₹' +
                (amount / 100000)
                  .toFixed(1) +
                'L';
            }

            if (amount >= 1000) {

              return '₹' +
                (amount / 1000)
                  .toFixed(0) +
                'K';
            }

            return '₹' + amount;
          }
        }
      }
    }
  };

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private loanService: LoanService,
    private clScheduleService: ClScheduleService,
    private repaymentService: RepaymentService
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadDashboard();
  }

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  loadDashboard(): void {

    /*
     * CMRC loads first and automatically selects
     * the first CMRC.
     *
     * Loans / schedules / repayments are loaded
     * independently and then applied to the
     * currently selected filter.
     */

    this.loadCmrc();

    this.loadAllLoans();

    this.loadAllSchedules();

    this.loadAllRepayments();
  }

  // =====================================================
  // CMRC
  // =====================================================

  loadCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: any[]) => {

        this.cmrcList = data || [];

        this.totalCmrc =
          this.cmrcList.length;

        // Overall CMRC balance
        this.totalCmrcBalance =
          this.cmrcList.reduce(
            (sum, cmrc) =>
              sum +
              Number(
                cmrc.totalFund || 0
              ),
            0
          );

        // Overall left CMRC balance
        this.leftCmrcBalance =
          this.cmrcList.reduce(
            (sum, cmrc) => {

              const totalFund =
                Number(
                  cmrc.totalFund || 0
                );

              const received =
                Number(
                  cmrc.tezshreeFundReceivedTotal || 0
                );

              return sum +
                Math.max(
                  totalFund - received,
                  0
                );

            },
            0
          );

        // =================================================
        // DEFAULT FIRST CMRC
        // =================================================

        if (this.cmrcList.length > 0) {

          this.selectedCmrcId =
            Number(
              this.cmrcList[0].id
            );

          this.selectedVoAlfId = null;
          this.selectedVoAlf = null;

          // Load selected CMRC data
          this.onCmrcChange();

        } else {

          this.selectedCmrcId = null;
          this.selectedVoAlfId = null;
          this.selectedVoAlf = null;

          this.voAlfList = [];

          this.loanList = [];

          this.calculateLoanTotals([]);

        }

      },

      error: (error) => {

        console.error(
          'CMRC loading error:',
          error
        );

        this.cmrcList = [];
        this.selectedCmrcId = null;
        this.voAlfList = [];

      }

    });
  }

  // =====================================================
  // ALL VO / ALF
  // =====================================================

  loadAllVoAlf(): void {

    this.voAlfService.getAll().subscribe({

      next: (data: any[]) => {

        const allVoAlf =
          data || [];

        /*
         * If a CMRC is already selected,
         * do not replace the displayed list
         * with all CMRCs' VO/ALFs.
         */

        if (this.selectedCmrcId !== null) {

          this.voAlfList =
            allVoAlf.filter(
              vo =>
                Number(
                  vo.cmrcId
                ) ===
                Number(
                  this.selectedCmrcId
                )
            );

        } else {

          this.voAlfList =
            allVoAlf;
        }

        this.totalVoAlf =
          this.voAlfList.length;

        this.totalAlfBalance =
          this.voAlfList.reduce(
            (sum, vo) =>
              sum +
              Number(
                vo.receivedFund || 0
              ),
            0
          );

        this.leftAlfBalance =
          this.totalAlfBalance;

      },

      error: (error) => {

        console.error(
          'VO/ALF loading error:',
          error
        );

        this.voAlfList = [];

      }

    });
  }

  // =====================================================
  // CMRC CHANGE
  // =====================================================

  onCmrcChange(): void {

    // Reset VO / ALF filter
    this.selectedVoAlfId = null;
    this.selectedVoAlf = null;

    // =================================================
    // NO CMRC SELECTED
    // =================================================

    if (this.selectedCmrcId === null) {

      this.voAlfList = [];

      this.loanList = [
        ...this.allLoanList
      ];

      this.totalVoAlf = 0;

      this.totalAlfBalance = 0;
      this.leftAlfBalance = 0;

      this.calculateLoanTotals(
        this.loanList
      );

      this.buildMonthlyLoanChart();

      this.buildRepaymentPurposeChart(
        this.allRepaymentList
      );

      return;
    }

    // =================================================
    // SELECTED CMRC BALANCE
    // =================================================

    const selectedCmrc =
      this.cmrcList.find(
        cmrc =>
          Number(cmrc.id) ===
          Number(this.selectedCmrcId)
      );

    if (selectedCmrc) {

      this.totalCmrcBalance =
        Number(
          selectedCmrc.totalFund || 0
        );

      const totalFund =
        Number(
          selectedCmrc.totalFund || 0
        );

      const received =
        Number(
          selectedCmrc.tezshreeFundReceivedTotal || 0
        );

      this.leftCmrcBalance =
        Math.max(
          totalFund - received,
          0
        );
    }

    // =================================================
    // LOAD VO / ALF FOR SELECTED CMRC
    // =================================================

    this.voAlfService
      .getByCmrcId(
        this.selectedCmrcId
      )
      .subscribe({

        next: (data: any[]) => {

          this.voAlfList =
            data || [];

          this.totalVoAlf =
            this.voAlfList.length;

          this.totalAlfBalance =
            this.voAlfList.reduce(
              (sum, vo) =>
                sum +
                Number(
                  vo.receivedFund || 0
                ),
              0
            );

          this.leftAlfBalance =
            this.totalAlfBalance;

          // =================================================
          // FILTER ALL LOANS BY CMRC
          // =================================================

          this.refreshLoansForCurrentFilter();

        },

        error: (error) => {

          console.error(
            'VO/ALF by CMRC error:',
            error
          );

          this.voAlfList = [];

          this.totalVoAlf = 0;

          this.totalAlfBalance = 0;
          this.leftAlfBalance = 0;

          this.refreshLoansForCurrentFilter();

        }

      });
  }

  // =====================================================
  // REFRESH LOANS FOR CURRENT FILTER
  // =====================================================

  refreshLoansForCurrentFilter(): void {

    // =================================================
    // SELECTED VO / ALF
    // =================================================

    if (this.selectedVoAlfId !== null) {

      this.loanList =
        this.allLoanList.filter(
          loan =>
            Number(
              loan.voAlfId
            ) ===
            Number(
              this.selectedVoAlfId
            )
        );

      this.calculateLoanTotals(
        this.loanList
      );

      this.buildMonthlyLoanChart();

      this.buildRepaymentPurposeChart(
        this.getRepaymentsForLoans(
          this.loanList
        )
      );

      return;
    }

    // =================================================
    // SELECTED CMRC
    // =================================================

    if (this.selectedCmrcId !== null) {

      this.loanList =
        this.allLoanList.filter(
          loan =>
            Number(
              loan.cmrcId
            ) ===
            Number(
              this.selectedCmrcId
            )
        );

      this.calculateLoanTotals(
        this.loanList
      );

      this.buildMonthlyLoanChart();

      this.buildRepaymentPurposeChart(
        this.getRepaymentsForLoans(
          this.loanList
        )
      );

      return;
    }

    // =================================================
    // NO FILTER
    // =================================================

    this.loanList =
      [...this.allLoanList];

    this.calculateLoanTotals(
      this.loanList
    );

    this.buildMonthlyLoanChart();

    this.buildRepaymentPurposeChart(
      this.allRepaymentList
    );
  }

  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    // =================================================
    // ALL VO / ALF OF SELECTED CMRC
    // =================================================

    if (this.selectedVoAlfId === null) {

      this.selectedVoAlf = null;

      if (this.selectedCmrcId !== null) {

        /*
         * Do NOT call onCmrcChange() here.
         * It would unnecessarily reload VO/ALF.
         *
         * Just restore all loans of current CMRC.
         */

        this.refreshLoansForCurrentFilter();

        // Restore CMRC-level VO/ALF balance
        this.totalAlfBalance =
          this.voAlfList.reduce(
            (sum, vo) =>
              sum +
              Number(
                vo.receivedFund || 0
              ),
            0
          );

        this.leftAlfBalance =
          this.totalAlfBalance;

      } else {

        this.refreshLoansForCurrentFilter();

      }

      return;
    }

    // =================================================
    // SELECTED VO / ALF
    // =================================================

    this.selectedVoAlf =
      this.voAlfList.find(
        vo =>
          Number(vo.id) ===
          Number(
            this.selectedVoAlfId
          )
      );

    if (!this.selectedVoAlf) {

      this.loanList = [];

      this.calculateLoanTotals([]);

      return;
    }

    // Selected VO / ALF fund
    this.totalAlfBalance =
      Number(
        this.selectedVoAlf.receivedFund || 0
      );

    this.leftAlfBalance =
      this.totalAlfBalance;

    // =================================================
    // LOAD SELECTED VO / ALF LOANS
    // =================================================

    this.loanService
      .getByVoAlfId(
        this.selectedVoAlfId
      )
      .subscribe({

        next: (data: any[]) => {

          const loans =
            data || [];

          this.loanList = [
            ...loans
          ];

          /*
           * Keep master list intact.
           * Do not overwrite allLoanList.
           */

          this.calculateLoanTotals(
            this.loanList
          );

          this.buildMonthlyLoanChart();

          const repayments =
            this.getRepaymentsForLoans(
              this.loanList
            );

          this.buildRepaymentPurposeChart(
            repayments
          );

          this.loadSelectedVoAlfSchedules(
            this.loanList
          );

        },

        error: (error) => {

          console.error(
            'VO/ALF loans error:',
            error
          );

          // Fallback to locally filtered master list
          this.loanList =
            this.allLoanList.filter(
              loan =>
                Number(
                  loan.voAlfId
                ) ===
                Number(
                  this.selectedVoAlfId
                )
            );

          this.calculateLoanTotals(
            this.loanList
          );

          this.buildMonthlyLoanChart();

          this.buildRepaymentPurposeChart(
            this.getRepaymentsForLoans(
              this.loanList
            )
          );

        }

      });
  }

  // =====================================================
  // LOAD ALL LOANS
  // =====================================================

  loadAllLoans(): void {

    this.loanService.getAll().subscribe({

      next: (data: any[]) => {

        // Keep complete master list
        this.allLoanList =
          data || [];

        /*
         * IMPORTANT:
         *
         * CMRC may already be selected because
         * CMRC API and Loan API load asynchronously.
         *
         * Therefore always apply the current
         * filter after loan data arrives.
         */

        this.refreshLoansForCurrentFilter();

      },

      error: (error) => {

        console.error(
          'Loan loading error:',
          error
        );

        this.allLoanList = [];

        this.loanList = [];

        this.calculateLoanTotals([]);

      }

    });
  }

  // =====================================================
  // CALCULATE LOAN TOTALS
  // =====================================================

  calculateLoanTotals(
    loans: any[]
  ): void {

    const currentLoans =
      loans || [];

    // =================================================
    // TOTAL LOANS
    // =================================================

    this.totalLoans =
      currentLoans.length;

    // =================================================
    // TOTAL LOAN AMOUNT
    // =================================================

    this.totalLoanAmount =
      currentLoans.reduce(
        (sum, loan) => {

          const amount =
            this.getLoanAmount(
              loan
            );

          return sum + amount;

        },
        0
      );

    // =================================================
    // ACTIVE LOANS
    // =================================================

    this.activeLoans =
      currentLoans.filter(
        loan =>
          this.normalizeLoanStatus(
            loan.loanStatus
          ) === 'ACTIVE'
      ).length;

    // =================================================
    // CLOSED LOANS
    // =================================================

    this.closedLoans =
      currentLoans.filter(
        loan =>
          this.normalizeLoanStatus(
            loan.loanStatus
          ) === 'CLOSED'
      ).length;

    // =================================================
    // WOMEN
    // =================================================

    const womenSet =
      new Set<string>();

    currentLoans.forEach(loan => {

      const womanName =
        String(
          loan.womanName ||
          loan.woman?.womanName ||
          ''
        )
          .trim()
          .toLowerCase();

      if (womanName) {

        womenSet.add(
          womanName
        );

      }

    });

    this.totalWomen =
      womenSet.size;

    // =================================================
    // RECENT LOANS
    // =================================================

    this.recentLoans =
      [...currentLoans]
        .sort((a, b) => {

          const dateA =
            new Date(
              a.loanGivenDate || 0
            ).getTime();

          const dateB =
            new Date(
              b.loanGivenDate || 0
            ).getTime();

          return dateB - dateA;

        })
        .slice(0, 5);

    // Refresh recent activity fallback
    if (
      this.allRepaymentList &&
      this.allRepaymentList.length > 0
    ) {

      this.buildRecentActivities(
        this.getRepaymentsForLoans(
          currentLoans
        )
      );

    }

  }

  // =====================================================
  // GET LOAN AMOUNT
  // =====================================================

  getLoanAmount(
    loan: any
  ): number {

    if (!loan) {
      return 0;
    }

    const amount =
      loan.loanAmount ??
      loan.disbursedAmount ??
      loan.totalAmount ??
      loan.sanctionedAmount ??
      0;

    const value =
      Number(amount);

    return isNaN(value)
      ? 0
      : value;
  }

  // =====================================================
  // BACKWARD COMPATIBILITY
  // =====================================================

  calculateSelectedVoAlfTotals(
    loans: any[]
  ): void {

    this.loanList = [
      ...(loans || [])
    ];

    this.calculateLoanTotals(
      this.loanList
    );
  }

  // =====================================================
  // MONTHLY LOAN DISBURSEMENT
  // =====================================================

  buildMonthlyLoanChart(): void {

    const monthlyAmount: number[] =
      new Array(12).fill(0);

    this.loanList.forEach(loan => {

      if (!loan.loanGivenDate) {
        return;
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
        return;
      }

      const month =
        date.getMonth();

      monthlyAmount[month] +=
        this.getLoanAmount(
          loan
        );
    });

    this.monthlyLoanChartData = {

      labels: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],

      datasets: [
        {

          label:
            'Loan Disbursement',

          data:
            monthlyAmount,

          borderColor:
            '#d4af37',

          backgroundColor:
            'rgba(212, 175, 55, 0.15)',

          fill: true,

          tension: 0.4,

          pointRadius: 5,

          pointHoverRadius: 7

        }
      ]
    };
  }

  // =====================================================
  // CL SCHEDULE
  // =====================================================

  loadAllSchedules(): void {

    this.clScheduleService
      .getAll()
      .subscribe({

        next: (data: any[]) => {

          const schedules =
            data || [];

          /*
           * If CMRC / VO filter is selected,
           * calculate schedule only for current loans.
           */

          if (this.loanList.length > 0) {

            const loanIds =
              new Set(
                this.loanList.map(
                  loan =>
                    Number(
                      loan.id
                    )
                )
              );

            const selectedSchedules =
              schedules.filter(
                schedule =>
                  loanIds.has(
                    Number(
                      schedule.loanId
                    )
                  )
              );

            this.totalScheduledEmi =
              selectedSchedules.reduce(
                (sum, schedule) =>
                  sum +
                  Number(
                    schedule.monthlyInstallment || 0
                  ),
                0
              );

            this.totalInstallments =
              selectedSchedules.length;

          } else {

            this.totalScheduledEmi = 0;
            this.totalInstallments = 0;

          }

        },

        error: (error) => {

          console.error(
            'CL Schedule loading error:',
            error
          );

        }

      });
  }

  // =====================================================
  // REPAYMENTS
  // =====================================================

  loadAllRepayments(): void {

    this.repaymentService
      .getAll()
      .subscribe({

        next: (data: any[]) => {

          this.allRepaymentList =
            data || [];

          /*
           * Always calculate repayment summary
           * according to current dashboard filter.
           */

          const currentRepayments =
            this.getRepaymentsForLoans(
              this.loanList
            );

          this.calculateRepaymentSummary(
            currentRepayments
          );

          this.buildRepaymentPurposeChart(
            currentRepayments
          );

        },

        error: (error) => {

          console.error(
            'Repayment loading error:',
            error
          );

          this.allRepaymentList = [];

          this.repaymentPurposeChartData = [];

          this.resetRepaymentChart();

        }

      });
  }

  // =====================================================
  // GET REPAYMENTS FOR CURRENT LOANS
  // =====================================================

  getRepaymentsForLoans(
    loans: any[]
  ): any[] {

    if (
      !loans ||
      loans.length === 0 ||
      !this.allRepaymentList
    ) {

      return [];
    }

    const loanIds =
      new Set(
        loans.map(
          loan =>
            Number(
              loan.id
            )
        )
      );

    return this.allRepaymentList
      .filter(
        repayment =>
          loanIds.has(
            Number(
              repayment.loanId
            )
          )
      );
  }

  // =====================================================
  // REPAYMENT SUMMARY
  // =====================================================

  calculateRepaymentSummary(
    repayments: any[]
  ): void {

    this.totalPaidAmount = 0;
    this.totalPenalty = 0;

    this.paidInstallments = 0;
    this.partialInstallments = 0;
    this.pendingInstallments = 0;

    this.partialAmount = 0;

    this.regularRepayments = 0;
    this.irregularRepayments = 0;

    (repayments || []).forEach(rep => {

      const paid =
        Number(
          rep.paidAmount || 0
        );

      const penalty =
        Number(
          rep.penaltyAmount || 0
        );

      this.totalPaidAmount +=
        paid;

      this.totalPenalty +=
        penalty;

      const status =
        String(
          rep.status || ''
        )
          .trim()
          .toUpperCase();

      if (status === 'PAID') {

        this.paidInstallments++;

      } else if (status === 'PARTIAL') {

        this.partialInstallments++;

        this.partialAmount +=
          paid;

      } else {

        this.pendingInstallments++;

      }

      const regular =
        String(
          rep.regularRepayment || ''
        )
          .trim()
          .toLowerCase();

      if (
        regular === 'yes' ||
        regular === 'true'
      ) {

        this.regularRepayments++;

      } else if (regular) {

        this.irregularRepayments++;

      }

    });

    this.totalOutstandingAmount =
      Math.max(
        this.totalScheduledEmi -
        this.totalPaidAmount,
        0
      );

    this.buildRecentActivities(
      repayments || []
    );
  }

  // =====================================================
  // REPAYMENT PURPOSE CHART
  // =====================================================

  buildRepaymentPurposeChart(
    repayments: any[]
  ): void {

    const purposeMap: {
      [key: string]: {
        purpose: string;
        amount: number;
        women: Set<number>;
      };
    } = {};

    (repayments || []).forEach(rep => {

      const loan =
        this.allLoanList.find(
          l =>
            Number(l.id) ===
            Number(rep.loanId)
        );

      if (!loan) {
        return;
      }

      const rawPurpose =
        String(
          loan.loanPurpose ||
          'Other'
        ).trim();

      const purposeKey =
        rawPurpose.toLowerCase();

      const displayPurpose =
        rawPurpose.charAt(0).toUpperCase() +
        rawPurpose.slice(1).toLowerCase();

      const paidAmount =
        Number(
          rep.paidAmount ??
          rep.amountPaid ??
          rep.repaymentAmount ??
          rep.amount ??
          0
        );

      if (!purposeMap[purposeKey]) {

        purposeMap[purposeKey] = {

          purpose:
            displayPurpose,

          amount:
            0,

          women:
            new Set<number>()

        };

      }

      purposeMap[purposeKey].amount +=
        paidAmount;

      if (loan.womanId) {

        purposeMap[purposeKey].women.add(
          Number(
            loan.womanId
          )
        );

      }

    });

    this.repaymentPurposeChartData =
      Object.values(
        purposeMap
      )
        .filter(
          item =>
            item.amount > 0
        )
        .map(
          item => ({

            purpose:
              item.purpose,

            amount:
              item.amount,

            womenCount:
              item.women.size

          })
        );

    this.repaymentChartData = {

      labels:
        this.repaymentPurposeChartData.map(
          item =>
            item.purpose
        ),

      datasets: [

        {

          data:
            this.repaymentPurposeChartData.map(
              item =>
                item.amount
            ),

          backgroundColor:
            this.repaymentPurposeChartData.map(
              (_item, index) =>
                this.getPurposeColor(index)
            ),

          borderWidth:
            3,

          borderColor:
            '#ffffff',

          hoverOffset:
            8

        }

      ]

    };
  }

  // =====================================================
  // RESET REPAYMENT CHART
  // =====================================================

  resetRepaymentChart(): void {

    this.repaymentChartData = {

      labels: [],

      datasets: [

        {

          data: [],

          backgroundColor: [],

          borderWidth: 3,

          borderColor:
            '#ffffff',

          hoverOffset: 8

        }

      ]

    };
  }

  // =====================================================
  // PURPOSE COLOR
  // =====================================================

  getPurposeColor(
    index: number
  ): string {

    return this.chartColors[
      index %
      this.chartColors.length
    ];
  }

  // =====================================================
  // SELECTED VO / ALF SCHEDULES
  // =====================================================

  loadSelectedVoAlfSchedules(
    loans: any[]
  ): void {

    const loanIds =
      (loans || []).map(
        loan =>
          Number(
            loan.id
          )
      );

    this.clScheduleService
      .getAll()
      .subscribe({

        next: (
          schedules: any[]
        ) => {

          const selectedSchedules =
            (schedules || [])
              .filter(
                schedule =>
                  loanIds.includes(
                    Number(
                      schedule.loanId
                    )
                  )
              );

          this.totalScheduledEmi =
            selectedSchedules.reduce(
              (sum, schedule) =>
                sum +
                Number(
                  schedule.monthlyInstallment || 0
                ),
              0
            );

          this.totalInstallments =
            selectedSchedules.length;

          const selectedRepayments =
            this.getRepaymentsForLoans(
              loans
            );

          this.calculateRepaymentSummary(
            selectedRepayments
          );

          this.buildRepaymentPurposeChart(
            selectedRepayments
          );

        },

        error: (error) => {

          console.error(
            'Selected schedule loading error:',
            error
          );

        }

      });
  }

  // =====================================================
  // BANK BALANCE
  // =====================================================

  loadBankBalance(): void {

    // Existing bank balance API
    // can remain here.

  }

  // =====================================================
  // RECENT ACTIVITIES
  // =====================================================

  buildRecentActivities(
    repayments: any[]
  ): void {

    this.recentActivities = [];

    const recentPaid =
      [...(repayments || [])]
        .filter(
          rep =>
            Number(
              rep.paidAmount || 0
            ) > 0
        )
        .slice(-4)
        .reverse();

    recentPaid.forEach(rep => {

      const loan =
        this.allLoanList.find(
          l =>
            Number(l.id) ===
            Number(rep.loanId)
        );

      this.recentActivities.push({

        type:
          'repayment',

        title:
          'Repayment Received',

        womanName:
          loan?.womanName ||
          'Unknown',

        amount:
          Number(
            rep.paidAmount || 0
          )

      });

    });

    if (
      this.recentActivities.length === 0 &&
      this.recentLoans.length > 0
    ) {

      const loan =
        this.recentLoans[0];

      this.recentActivities.push({

        type:
          'loan',

        title:
          'New Loan',

        womanName:
          loan.womanName ||
          'Unknown',

        amount:
          this.getLoanAmount(
            loan
          )

      });

    }

  }

  // =====================================================
  // NORMALIZE LOAN STATUS
  // =====================================================

  normalizeLoanStatus(
    status: any
  ): string {

    const value =
      String(
        status || ''
      )
        .trim()
        .toUpperCase();

    if (
      value === 'ACTIVE' ||
      value === 'RUNNING' ||
      value === 'OPEN'
    ) {

      return 'ACTIVE';

    }

    if (
      value === 'CLOSED' ||
      value === 'CLOSE' ||
      value === 'COMPLETED' ||
      value === 'PAID'
    ) {

      return 'CLOSED';

    }

    return value || '-';
  }

  // =====================================================
  // ACTIVE LOAN COUNT
  // =====================================================

  getActiveLoanCount(): number {

    if (
      !this.loanList ||
      this.loanList.length === 0
    ) {

      return 0;

    }

    return this.loanList.filter(
      loan =>
        this.normalizeLoanStatus(
          loan.loanStatus
        ) === 'ACTIVE'
    ).length;
  }

  // =====================================================
  // CLOSED LOAN COUNT
  // =====================================================

  getClosedLoanCount(): number {

    if (
      !this.loanList ||
      this.loanList.length === 0
    ) {

      return 0;

    }

    return this.loanList.filter(
      loan =>
        this.normalizeLoanStatus(
          loan.loanStatus
        ) === 'CLOSED'
    ).length;
  }

  // =====================================================
  // LOAN LIST TOTAL AMOUNT
  // =====================================================

  getLoanListTotalAmount(): number {

    if (
      !this.loanList ||
      this.loanList.length === 0
    ) {

      return 0;

    }

    return this.loanList.reduce(
      (total, loan) =>
        total +
        this.getLoanAmount(
          loan
        ),
      0
    );
  }

  // =====================================================
  // RESET / CLEAR FILTERS
  // =====================================================

  clearFilters(): void {

    /*
     * Keep original "clear filters" behavior:
     * show complete data.
     */

    this.selectedCmrcId = null;

    this.selectedVoAlfId = null;

    this.selectedVoAlf = null;

    this.voAlfList = [];

    // Restore all loans
    this.loanList = [
      ...this.allLoanList
    ];

    this.calculateLoanTotals(
      this.loanList
    );

    this.buildMonthlyLoanChart();

    this.buildRepaymentPurposeChart(
      this.allRepaymentList
    );

    // Restore overall CMRC
    this.totalCmrc =
      this.cmrcList.length;

    // Load all VO/ALF again
    this.voAlfService
      .getAll()
      .subscribe({

        next: (data: any[]) => {

          this.voAlfList =
            data || [];

          this.totalVoAlf =
            this.voAlfList.length;

          this.totalAlfBalance =
            this.voAlfList.reduce(
              (sum, vo) =>
                sum +
                Number(
                  vo.receivedFund || 0
                ),
              0
            );

          this.leftAlfBalance =
            this.totalAlfBalance;

        },

        error: (error) => {

          console.error(
            'VO/ALF reset loading error:',
            error
          );

        }

      });

    this.totalCmrcBalance =
      this.cmrcList.reduce(
        (sum, cmrc) =>
          sum +
          Number(
            cmrc.totalFund || 0
          ),
        0
      );

    this.leftCmrcBalance =
      this.cmrcList.reduce(
        (sum, cmrc) => {

          const totalFund =
            Number(
              cmrc.totalFund || 0
            );

          const received =
            Number(
              cmrc.tezshreeFundReceivedTotal || 0
            );

          return sum +
            Math.max(
              totalFund - received,
              0
            );

        },
        0
      );

    // Reset repayment summary
    this.calculateRepaymentSummary(
      this.allRepaymentList
    );
  }

  // =====================================================
  // TABS
  // =====================================================

  setActiveTab(
    tab: string
  ): void {

    this.activeTab =
      tab;
  }
}
