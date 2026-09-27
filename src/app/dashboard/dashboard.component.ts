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
            const value = Number(context.raw || 0);

            return ' ₹' + value.toLocaleString('en-IN');
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
        backgroundColor: 'rgba(212, 175, 55, 0.15)',

        fill: true,
        tension: 0.4,

        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  monthlyLoanChartOptions: ChartConfiguration<'line'>['options'] = {

    responsive: true,
    maintainAspectRatio: false,

    plugins: {

      legend: {
        display: false
      },

      tooltip: {

        callbacks: {

          label: (context: any) => {

            const value = Number(context.raw || 0);

            return ' ₹' + value.toLocaleString('en-IN');
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

            const amount = Number(value);

            if (amount >= 100000) {
              return '₹' + (amount / 100000).toFixed(1) + 'L';
            }

            if (amount >= 1000) {
              return '₹' + (amount / 1000).toFixed(0) + 'K';
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

    this.loadCmrc();
    this.loadAllVoAlf();
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

        this.totalCmrc = this.cmrcList.length;

        this.totalCmrcBalance = this.cmrcList.reduce(
          (sum, cmrc) =>
            sum + Number(cmrc.totalFund || 0),
          0
        );

        this.leftCmrcBalance = this.cmrcList.reduce(
          (sum, cmrc) => {

            const totalFund =
              Number(cmrc.totalFund || 0);

            const received =
              Number(
                cmrc.tezshreeFundReceivedTotal || 0
              );

            return sum +
              Math.max(totalFund - received, 0);
          },

          0
        );
      },

      error: (error) => {

        console.error(
          'CMRC loading error:',
          error
        );
      }
    });
  }

  // =====================================================
  // ALL VO / ALF
  // =====================================================

  loadAllVoAlf(): void {

    this.voAlfService.getAll().subscribe({

      next: (data: any[]) => {

        this.voAlfList = data || [];

        this.totalVoAlf =
          this.voAlfList.length;

        this.totalAlfBalance =
          this.voAlfList.reduce(
            (sum, vo) =>
              sum + Number(vo.receivedFund || 0),
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
      }
    });
  }

  // =====================================================
  // CMRC CHANGE
  // =====================================================

  onCmrcChange(): void {

    this.selectedVoAlfId = null;
    this.selectedVoAlf = null;

    if (!this.selectedCmrcId) {

      this.voAlfList = [];

      this.loadAllVoAlf();

      return;
    }

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: any[]) => {

          this.voAlfList = data || [];

          this.totalAlfBalance =
            this.voAlfList.reduce(
              (sum, vo) =>
                sum + Number(vo.receivedFund || 0),
              0
            );

          this.leftAlfBalance =
            this.totalAlfBalance;

          const selectedCmrc =
            this.cmrcList.find(
              c => c.id === this.selectedCmrcId
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
        },

        error: (error) => {

          console.error(
            'VO/ALF by CMRC error:',
            error
          );
        }
      });
  }

  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    if (!this.selectedVoAlfId) {

      this.selectedVoAlf = null;

      if (this.selectedCmrcId) {

        this.onCmrcChange();

      } else {

        this.loadAllVoAlf();
      }

      return;
    }

    this.selectedVoAlf =
      this.voAlfList.find(
        vo => vo.id === this.selectedVoAlfId
      );

    if (!this.selectedVoAlf) {
      return;
    }

    this.totalAlfBalance =
      Number(
        this.selectedVoAlf.receivedFund || 0
      );

    this.leftAlfBalance =
      this.totalAlfBalance;

    this.loanService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({

        next: (data: any[]) => {

          const loans = data || [];

          this.calculateSelectedVoAlfTotals(
            loans
          );

          this.loadSelectedVoAlfSchedules(
            loans
          );
        },

        error: (error) => {

          console.error(
            'VO/ALF loans error:',
            error
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

        this.loanList = data || [];

        this.totalLoans =
          this.loanList.length;

        this.totalLoanAmount =
          this.loanList.reduce(
            (sum, loan) =>
              sum + Number(
                loan.loanAmount || 0
              ),
            0
          );

        const womenSet =
          new Set<string>();

        this.loanList.forEach(loan => {

          const name =
            String(
              loan.womanName || ''
            )
              .trim()
              .toLowerCase();

          if (name) {
            womenSet.add(name);
          }
        });

        this.totalWomen =
          womenSet.size;

        this.recentLoans =
          [...this.loanList]
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

        // NEW MONTHLY CHART
        this.buildMonthlyLoanChart();
      },

      error: (error) => {

        console.error(
          'Loan loading error:',
          error
        );
      }
    });
  }

  // =====================================================
  // SELECTED VO / ALF TOTALS
  // =====================================================

  calculateSelectedVoAlfTotals(
    loans: any[]
  ): void {

    this.totalLoans =
      loans.length;

    this.totalLoanAmount =
      loans.reduce(
        (sum, loan) =>
          sum + Number(
            loan.loanAmount || 0
          ),
        0
      );

    const womenSet =
      new Set<string>();

    loans.forEach(loan => {

      const woman =
        String(
          loan.womanName || ''
        )
          .trim()
          .toLowerCase();

      if (woman) {
        womenSet.add(woman);
      }
    });

    this.totalWomen =
      womenSet.size;

    this.recentLoans =
      [...loans]
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
        new Date(loan.loanGivenDate);

      if (isNaN(date.getTime())) {
        return;
      }

      const month =
        date.getMonth();

      monthlyAmount[month] +=
        Number(
          loan.loanAmount || 0
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
          label: 'Loan Disbursement',

          data: monthlyAmount,

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
  }

  // =====================================================
  // CL SCHEDULE
  // =====================================================

  loadAllSchedules(): void {

    this.clScheduleService.getAll().subscribe({

      next: (data: any[]) => {

        const schedules =
          data || [];

        this.totalScheduledEmi =
          schedules.reduce(
            (sum, schedule) =>
              sum + Number(
                schedule.monthlyInstallment || 0
              ),
            0
          );

        this.totalInstallments =
          schedules.length;
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

    this.repaymentService.getAll().subscribe({

      next: (data: any[]) => {

        const repayments =
          data || [];

        this.calculateRepaymentSummary(
          repayments
        );

        this.buildRepaymentPurposeChart(
          repayments
        );
      },

      error: (error) => {

        console.error(
          'Repayment loading error:',
          error
        );
      }
    });
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

    repayments.forEach(rep => {

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
        ).toUpperCase();

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
        ).toLowerCase();

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
      repayments
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
        amount: number;
        women: Set<string>;
      }
    } = {};

    repayments.forEach(rep => {

      const loan =
        this.loanList.find(
          l =>
            Number(l.id) ===
            Number(rep.loanId)
        );

      if (!loan) {
        return;
      }

      const purpose =
        String(
          loan.loanPurpose ||
          'Other'
        ).trim() || 'Other';

      const amount =
        Number(
          rep.paidAmount || 0
        );

      if (!purposeMap[purpose]) {

        purposeMap[purpose] = {

          amount: 0,

          women:
            new Set<string>()
        };
      }

      purposeMap[purpose].amount +=
        amount;

      const womanName =
        String(
          loan.womanName || ''
        )
          .trim()
          .toLowerCase();

      if (womanName) {

        purposeMap[purpose]
          .women
          .add(womanName);
      }
    });

    this.repaymentPurposeChartData =
      Object.keys(
        purposeMap
      ).map(purpose => ({

        purpose: purpose,

        amount:
          purposeMap[purpose].amount,

        womenCount:
          purposeMap[purpose]
            .women.size
      }));

    this.repaymentChartData = {

      labels:
        this.repaymentPurposeChartData
          .map(item => item.purpose),

      datasets: [
        {
          data:
            this.repaymentPurposeChartData
              .map(item => item.amount),

          backgroundColor:
            this.chartColors,

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
      loans.map(
        loan => Number(loan.id)
      );

    this.clScheduleService
      .getAll()
      .subscribe({

        next: (schedules: any[]) => {

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
                sum + Number(
                  schedule.monthlyInstallment ||
                  0
                ),
              0
            );

          this.totalInstallments =
            selectedSchedules.length;

          this.repaymentService
            .getAll()
            .subscribe({

              next: (
                repayments: any[]
              ) => {

                const selectedRepayments =
                  (repayments || [])
                    .filter(
                      repayment =>
                        loanIds.includes(
                          Number(
                            repayment.loanId
                          )
                        )
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
                  'Selected repayment loading error:',
                  error
                );
              }
            });
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
      [...repayments]
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
        this.loanList.find(
          l =>
            Number(l.id) ===
            Number(rep.loanId)
        );

      this.recentActivities.push({

        type: 'repayment',

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

        type: 'loan',

        title:
          'New Loan',

        womanName:
          loan.womanName ||
          'Unknown',

        amount:
          Number(
            loan.loanAmount || 0
          )
      });
    }
  }

  // =====================================================
  // RESET
  // =====================================================

  clearFilters(): void {

    this.selectedCmrcId = null;

    this.selectedVoAlfId = null;

    this.selectedVoAlf = null;

    this.loadDashboard();
  }

  // =====================================================
  // TABS
  // =====================================================

  setActiveTab(
    tab: string
  ): void {

    this.activeTab = tab;
  }
}