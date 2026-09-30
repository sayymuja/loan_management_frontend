import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef
} from '@angular/core';

import {
  ClSchedule,
  ClScheduleService
} from '../services/cl-schedule.service';

import {
  Loan,
  LoanService
} from '../services/loan.service';

import {
  Cmrc,
  CmrcService
} from '../services/cmrc.service';

import {
  VoAlf,
  VoAlfService
} from '../services/vo-alf.service';

import {
  Group,
  GroupService
} from '../services/group.service';

import {
  Women,
  WomenService
} from '../services/women.service';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cl-schedule',
  templateUrl: './cl-schedule.component.html',
  styleUrls: ['./cl-schedule.component.css']
})
export class ClScheduleComponent implements OnInit {

  /* =====================================================
     INPUT / OUTPUT
  ===================================================== */

  @Input() loanId: number | null = null;

  @Output() close = new EventEmitter<void>();

  /* =====================================================
     MASTER DATA
  ===================================================== */

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  groupList: Group[] = [];

  womenList: Women[] = [];

  allLoanList: Loan[] = [];

  filteredLoanList: Loan[] = [];

  scheduleList: ClSchedule[] = [];

  /* =====================================================
     SELECTED HIERARCHY
  ===================================================== */

  selectedCmrcId: number | null = null;

  selectedVoAlfId: number | null = null;

  selectedGroupId: number | null = null;

  selectedWomanId: number | null = null;

  selectedLoanId: number | null = null;

  /* =====================================================
     SELECTED LOAN
  ===================================================== */

  selectedLoan: Loan | null = null;

  selectedVillageName = '';

  /* =====================================================
     STATE
  ===================================================== */

  loading = false;

  private inputLoanResolved = false;

  constructor(
    private clScheduleService: ClScheduleService,
    private loanService: LoanService,
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService,
    private cdRef: ChangeDetectorRef
  ) {}

  /* =====================================================
     INIT
  ===================================================== */

  ngOnInit(): void {

    this.loadCmrcList();

    this.loadAllLoans();
  }

  /* =====================================================
     LOAD CMRC
  ===================================================== */

  loadCmrcList(): void {

    this.cmrcService.getAll().subscribe({
      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        this.tryResolveInputLoan();

        this.cdRef.detectChanges();
      },

      error: (error) => {

        console.error(
          'CMRC loading error:',
          error
        );

        this.cmrcList = [];
      }
    });
  }

  /* =====================================================
     LOAD ALL LOANS
  ===================================================== */

  loadAllLoans(): void {

    this.loanService.getAll().subscribe({

      next: (data: Loan[]) => {

        this.allLoanList = data || [];

        this.filteredLoanList = [...this.allLoanList];

        this.tryResolveInputLoan();

        this.cdRef.detectChanges();
      },

      error: (error) => {

        console.error(
          'Loan loading error:',
          error
        );

        this.allLoanList = [];

        this.filteredLoanList = [];
      }
    });
  }

  /* =====================================================
     RESOLVE INPUT LOAN
  ===================================================== */

  private tryResolveInputLoan(): void {

    if (
      this.inputLoanResolved ||
      !this.loanId ||
      !this.allLoanList.length
    ) {
      return;
    }

    const loan = this.allLoanList.find(
      item =>
        Number(item.id) === Number(this.loanId)
    );

    if (!loan) {
      return;
    }

    this.inputLoanResolved = true;

    this.selectedLoanId = loan.id || null;

    this.selectedCmrcId =
      loan.cmrcId || null;

    this.selectedVoAlfId =
      loan.voAlfId || null;

    this.selectedGroupId =
      loan.groupId || null;

    this.selectedWomanId =
      loan.womanId || null;

    this.selectedLoan = loan;

    this.selectedVillageName =
      loan.villageName || '';

    this.loadVoAlfForInputLoan();
  }

  /* =====================================================
     LOAD VO / ALF
  ===================================================== */

  private loadVoAlfForInputLoan(): void {

    if (!this.selectedCmrcId) {

      this.applyLoanFilters();

      this.loadScheduleForSelectedLoan();

      return;
    }

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          this.loadGroupsForInputLoan();
        },

        error: (error) => {

          console.error(
            'VO / ALF loading error:',
            error
          );

          this.voAlfList = [];

          this.loadGroupsForInputLoan();
        }
      });
  }

  /* =====================================================
     LOAD GROUP
  ===================================================== */

  private loadGroupsForInputLoan(): void {

    if (!this.selectedVoAlfId) {

      this.applyLoanFilters();

      this.loadScheduleForSelectedLoan();

      return;
    }

    this.groupService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

          this.loadWomenForInputLoan();
        },

        error: (error) => {

          console.error(
            'Group loading error:',
            error
          );

          this.groupList = [];

          this.loadWomenForInputLoan();
        }
      });
  }

  /* =====================================================
     LOAD WOMEN
  ===================================================== */

  private loadWomenForInputLoan(): void {

    if (!this.selectedGroupId) {

      this.applyLoanFilters();

      this.loadScheduleForSelectedLoan();

      return;
    }

    this.womenService
      .getByGroupId(this.selectedGroupId)
      .subscribe({

        next: (data: Women[]) => {

          this.womenList = data || [];

          this.applyLoanFilters();

          this.loadScheduleForSelectedLoan();
        },

        error: (error) => {

          console.error(
            'Women loading error:',
            error
          );

          this.womenList = [];

          this.applyLoanFilters();

          this.loadScheduleForSelectedLoan();
        }
      });
  }

  /* =====================================================
     CMRC CHANGE
  ===================================================== */

  onCmrcChange(): void {

    this.selectedVoAlfId = null;

    this.selectedGroupId = null;

    this.selectedWomanId = null;

    this.selectedLoanId = null;

    this.selectedLoan = null;

    this.selectedVillageName = '';

    this.scheduleList = [];

    this.groupList = [];

    this.womenList = [];

    if (!this.selectedCmrcId) {

      this.loadAllLoans();

      this.voAlfList = [];

      this.loadVoAlfList();

      return;
    }

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          this.applyLoanFilters();

          this.cdRef.detectChanges();
        },

        error: (error) => {

          console.error(
            'VO / ALF by CMRC error:',
            error
          );

          this.voAlfList = [];

          this.applyLoanFilters();
        }
      });
  }

  /* =====================================================
     LOAD ALL VO / ALF
  ===================================================== */

  loadVoAlfList(): void {

    this.voAlfService.getAll().subscribe({

      next: (data: VoAlf[]) => {

        this.voAlfList = data || [];

        this.cdRef.detectChanges();
      },

      error: (error) => {

        console.error(
          'VO / ALF loading error:',
          error
        );

        this.voAlfList = [];
      }
    });
  }

  /* =====================================================
     VO / ALF CHANGE
  ===================================================== */

  onVoAlfChange(): void {

    this.selectedGroupId = null;

    this.selectedWomanId = null;

    this.selectedLoanId = null;

    this.selectedLoan = null;

    this.selectedVillageName = '';

    this.groupList = [];

    this.womenList = [];

    this.scheduleList = [];

    if (!this.selectedVoAlfId) {

      this.applyLoanFilters();

      return;
    }

    this.groupService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

          this.updateVillageName();

          this.applyLoanFilters();

          this.cdRef.detectChanges();
        },

        error: (error) => {

          console.error(
            'Group loading error:',
            error
          );

          this.groupList = [];

          this.applyLoanFilters();
        }
      });
  }

  /* =====================================================
     GROUP CHANGE
  ===================================================== */

  onGroupChange(): void {

    this.selectedWomanId = null;

    this.selectedLoanId = null;

    this.selectedLoan = null;

    this.scheduleList = [];

    this.womenList = [];

    this.selectedVillageName = '';

    if (!this.selectedGroupId) {

      this.updateVillageName();

      this.applyLoanFilters();

      return;
    }

    const selectedGroup =
      this.groupList.find(
        group =>
          Number(group.id) ===
          Number(this.selectedGroupId)
      );

    if (selectedGroup) {

      this.selectedVillageName =
        selectedGroup.villageName || '';
    }

    this.womenService
      .getByGroupId(this.selectedGroupId)
      .subscribe({

        next: (data: Women[]) => {

          this.womenList = data || [];

          this.applyLoanFilters();

          this.cdRef.detectChanges();
        },

        error: (error) => {

          console.error(
            'Women loading error:',
            error
          );

          this.womenList = [];

          this.applyLoanFilters();
        }
      });
  }

  /* =====================================================
     WOMAN CHANGE
  ===================================================== */

  onWomanChange(): void {

    this.selectedLoanId = null;

    this.selectedLoan = null;

    this.scheduleList = [];

    this.applyLoanFilters();

    this.cdRef.detectChanges();
  }

  /* =====================================================
     LOAN CHANGE
  ===================================================== */

  onLoanChange(): void {

    this.scheduleList = [];

    this.selectedLoan = null;

    if (!this.selectedLoanId) {

      return;
    }

    const loan =
      this.allLoanList.find(
        item =>
          Number(item.id) ===
          Number(this.selectedLoanId)
      );

    if (!loan) {

      return;
    }

    this.selectedLoan = {
      ...loan,

      cmrcName:
        loan.cmrcName ||
        this.getCmrcNameById(loan.cmrcId),

      voAlfName:
        loan.voAlfName ||
        this.getVoAlfNameById(loan.voAlfId),

      groupName:
        loan.groupName ||
        this.getGroupNameById(loan.groupId),

      villageName:
        loan.villageName ||
        this.getVillageNameByGroupId(loan.groupId)
    };

    this.selectedVillageName =
      this.selectedLoan.villageName || '';

    this.loadScheduleForSelectedLoan();

    this.scrollToSchedule();
  }

  /* =====================================================
     FILTER LOANS
  ===================================================== */

  applyLoanFilters(): void {

    let result = [...this.allLoanList];

    if (this.selectedCmrcId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.cmrcId) ===
          Number(this.selectedCmrcId)
      );
    }

    if (this.selectedVoAlfId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.voAlfId) ===
          Number(this.selectedVoAlfId)
      );
    }

    if (this.selectedGroupId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.groupId) ===
          Number(this.selectedGroupId)
      );
    }

    if (this.selectedWomanId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.womanId) ===
          Number(this.selectedWomanId)
      );
    }

    this.filteredLoanList = result;

    /*
      If current selected loan is not available
      after hierarchy filtering, clear it.
    */
    if (this.selectedLoanId) {

      const exists =
        this.filteredLoanList.some(
          loan =>
            Number(loan.id) ===
            Number(this.selectedLoanId)
        );

      if (!exists) {

        this.selectedLoanId = null;

        this.selectedLoan = null;

        this.scheduleList = [];
      }
    }
  }

  /* =====================================================
     LOAD SCHEDULE
  ===================================================== */

  loadScheduleForSelectedLoan(): void {

    if (!this.selectedLoanId) {

      this.scheduleList = [];

      return;
    }

    this.loading = true;

    /*
      STEP 1:
      Check existing schedule.
    */

    this.clScheduleService
      .generateSchedule(this.selectedLoanId)
      .subscribe({

        next: (data: ClSchedule[]) => {

          if (data && data.length > 0) {

            /*
              Existing schedule found.
            */

            this.scheduleList =
              this.sortSchedule(data);

            this.loading = false;

            this.cdRef.detectChanges();

            return;
          }

          /*
            STEP 2:
            No schedule found.
            Automatically generate.
          */

          this.generateSchedule();
        },

        error: (error) => {

          console.error(
            'Schedule loading error:',
            error
          );

          /*
            If GET fails, do not blindly generate.
            First report the error.
          */

          this.scheduleList = [];

          this.loading = false;

          this.cdRef.detectChanges();
        }
      });
  }

  /* =====================================================
     GENERATE SCHEDULE
  ===================================================== */

  private generateSchedule(): void {

    if (!this.selectedLoanId) {

      this.loading = false;

      return;
    }

    this.clScheduleService
      .generateSchedule(this.selectedLoanId)
      .subscribe({

        next: (data: ClSchedule[]) => {

          this.scheduleList =
            this.sortSchedule(data || []);

          this.loading = false;

          this.cdRef.detectChanges();
        },

        error: (error) => {

          console.error(
            'Schedule generation error:',
            error
          );

          this.scheduleList = [];

          this.loading = false;

          alert(
            'CL repayment schedule could not be generated.'
          );

          this.cdRef.detectChanges();
        }
      });
  }

  /* =====================================================
     SORT SCHEDULE
  ===================================================== */

  private sortSchedule(
    schedules: ClSchedule[]
  ): ClSchedule[] {

    return [...schedules].sort(
      (a: ClSchedule, b: ClSchedule) =>
        Number(a.installmentNo || 0) -
        Number(b.installmentNo || 0)
    );
  }

  /* =====================================================
     SELECTED CMRC NAME
  ===================================================== */

  getSelectedCmrcName(): string {

    return this.getCmrcNameById(
      this.selectedCmrcId
    );
  }

  getCmrcNameById(
    cmrcId?: number | null
  ): string {

    if (!cmrcId) {
      return '';
    }

    const cmrc: any =
      this.cmrcList.find(
        item =>
          Number(item.id) ===
          Number(cmrcId)
      );

    return cmrc?.cmrcName || '';
  }

  /* =====================================================
     SELECTED VO / ALF NAME
  ===================================================== */

  getSelectedVoAlfName(): string {

    return this.getVoAlfNameById(
      this.selectedVoAlfId
    );
  }

  getVoAlfNameById(
    voAlfId?: number | null
  ): string {

    if (!voAlfId) {
      return '';
    }

    const voAlf: any =
      this.voAlfList.find(
        item =>
          Number(item.id) ===
          Number(voAlfId)
      );

    return voAlf?.voAlfName || '';
  }

  /* =====================================================
     GROUP NAME
  ===================================================== */

  getGroupNameById(
    groupId?: number | null
  ): string {

    if (!groupId) {
      return '';
    }

    const group: any =
      this.groupList.find(
        item =>
          Number(item.id) ===
          Number(groupId)
      );

    return group?.groupName || '';
  }

  getSelectedGroupName(): string {

    return this.getGroupNameById(
      this.selectedGroupId
    );
  }

  /* =====================================================
     VILLAGE NAME
  ===================================================== */

  getVillageNameByGroupId(
    groupId?: number | null
  ): string {

    if (!groupId) {
      return '';
    }

    const group: any =
      this.groupList.find(
        item =>
          Number(item.id) ===
          Number(groupId)
      );

    return group?.villageName || '';
  }

  updateVillageName(): void {

    if (this.selectedGroupId) {

      this.selectedVillageName =
        this.getVillageNameByGroupId(
          this.selectedGroupId
        );

      return;
    }

    if (!this.selectedVoAlfId) {

      this.selectedVillageName = '';

      return;
    }

    const group =
      this.groupList.find(
        item =>
          Number(item.voAlfId) ===
          Number(this.selectedVoAlfId) &&
          !!item.villageName
      );

    this.selectedVillageName =
      group?.villageName || '';
  }

  /* =====================================================
     WOMAN NAME
  ===================================================== */

  getSelectedWomanName(): string {

    if (!this.selectedWomanId) {
      return '';
    }

    const woman: any =
      this.womenList.find(
        item =>
          Number(item.id) ===
          Number(this.selectedWomanId)
      );

    return woman?.womanName || '';
  }

  /* =====================================================
     SANCTIONED AMOUNT
  ===================================================== */

  getSanctionedAmount(
    loan: Loan | null | undefined
  ): number {

    if (!loan) {
      return 0;
    }

    const loanAny: any = loan as any;

    return Number(
      loanAny.sanctionedAmount ??
      0
    );
  }

  /* =====================================================
     DISBURSED AMOUNT
  ===================================================== */

  getDisbursedAmount(
    loan: Loan | null | undefined
  ): number {

    if (!loan) {
      return 0;
    }

    const loanAny: any = loan as any;

    /*
      Backend:
      disbursed_amount -> loanAmount

      Also support older frontend:
      totalAmount / disbursedAmount
    */

    return Number(
      loanAny.loanAmount ??
      loanAny.disbursedAmount ??
      loanAny.totalAmount ??
      0
    );
  }

  /* =====================================================
     PROCESSING FEE
  ===================================================== */

  getProcessingFee(
    loan: Loan | null | undefined
  ): number {

    if (!loan) {
      return 0;
    }

    const loanAny: any = loan as any;

    return Number(
      loanAny.processingFee ??
      0
    );
  }

  /* =====================================================
     EXPORT EXCEL
  ===================================================== */

  exportToExcel(): void {

    if (
      !this.scheduleList ||
      this.scheduleList.length === 0
    ) {
      return;
    }

    const exportData =
      this.scheduleList.map(
        (schedule: ClSchedule, index: number) => {

          return {

            '#':
              schedule.installmentNo ||
              index + 1,

            'Installment Date':
              schedule.installmentDate
                ? this.formatExcelDate(
                    schedule.installmentDate
                  )
                : '',

            'Outstanding Amount':
              Number(
                schedule.outstandingAmount || 0
              ),

            'Principal':
              Number(
                schedule.principalAmount || 0
              ),

            'Interest':
              Number(
                schedule.interestAmount || 0
              ),

            'Installment Amount':
              Number(
                schedule.averageMonthlyInstallment || 0
              ),

            'Closing Balance':
              Number(
                schedule.closingBalance || 0
              )
          };
        }
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
      'CL Repayment Schedule'
    );

    const loanNumber =
      this.selectedLoan?.id || 'Loan';

    XLSX.writeFile(
      workbook,
      `CL-Repayment-Schedule-${loanNumber}.xlsx`
    );
  }

  /* =====================================================
     EXCEL DATE FORMAT
  ===================================================== */

  private formatExcelDate(
    dateValue: string
  ): string {

    const date =
      new Date(dateValue);

    if (isNaN(date.getTime())) {
      return dateValue;
    }

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    const monthNames = [
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
    ];

    const month =
      monthNames[
        date.getMonth()
      ];

    const year =
      date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /* =====================================================
     SCROLL TO SCHEDULE
  ===================================================== */

  private scrollToSchedule(): void {

    setTimeout(() => {

      const element =
        document.querySelector(
          '.schedule-card'
        );

      if (element) {

        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }

    }, 150);
  }

  /* =====================================================
     CLOSE
  ===================================================== */

  closeClScheduleView(): void {

    this.close.emit();
  }
  getTotalOutstandingAmount(): number {
  return this.scheduleList.reduce(
    (total: number, item: ClSchedule) =>
      total + (Number(item.outstandingAmount) || 0),
    0
  );
}

getTotalPrincipalAmount(): number {
  return this.scheduleList.reduce(
    (total: number, item: ClSchedule) =>
      total + (Number(item.principalAmount) || 0),
    0
  );
}

getTotalInterestAmount(): number {
  return this.scheduleList.reduce(
    (total: number, item: ClSchedule) =>
      total + (Number(item.interestAmount) || 0),
    0
  );
}

getTotalInstallmentAmount(): number {
  return this.scheduleList.reduce(
    (total: number, item: ClSchedule) =>
      total + (Number(item.averageMonthlyInstallment) || 0),
    0
  );
}
}