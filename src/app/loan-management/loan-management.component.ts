import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  Cmrc,
  CmrcService
} from '../services/cmrc.service';

import {
  VoAlf,
  VoAlfService
} from '../services/vo-alf.service';
import { switchMap, tap } from 'rxjs/operators';

import {
  Group,
  GroupService
} from '../services/group.service';

import {
  Women,
  WomenService
} from '../services/women.service';

import {
  Loan,
  LoanService
} from '../services/loan.service';
import { ClSchedule, ClScheduleService } from '../services/cl-schedule.service';
import { Repayment, RepaymentService } from '../services/repayment.service';


@Component({
  selector: 'app-loan-management',
  templateUrl: './loan-management.component.html',
  styleUrls: ['./loan-management.component.css']
})
export class LoanManagementComponent implements OnInit {

  // =====================================================
  // MASTER LISTS
  // =====================================================

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  groupList: Group[] = [];
  womenList: Women[] = [];

  // =====================================================
  // LOAN LIST
  // =====================================================

  loanList: Loan[] = [];
  filteredLoanList: Loan[] = [];

  // =====================================================
  // SELECTED HIERARCHY
  // =====================================================

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;
  selectedGroupId: number | null = null;
  selectedWomanId: number | null = null;

  // =====================================================
  // FUND SUMMARY
  // =====================================================

  totalAlfBalance = 0;

  totalSanctionedAmount = 0;

  leftAlfBalance = 0;

  // =====================================================
  // FORM
  // =====================================================

  showForm = false;

  isEditMode = false;

  editingLoanId: number | null = null;

  newLoan: any = this.getEmptyLoan();

  // =====================================================
  // SEARCH
  // =====================================================

  globalSearch = '';

  // =====================================================
  // DETAILS
  // =====================================================

  selectedLoan: Loan | null = null;

  // =====================================================
  // LOADING
  // =====================================================

  loading = false;


  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService,
    private loanService: LoanService,
    private cdRef: ChangeDetectorRef,
     private clScheduleService: ClScheduleService,
  private repaymentService: RepaymentService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadInitialData();

  }


  // =====================================================
  // INITIAL DATA
  // =====================================================

  loadInitialData(): void {

    this.loading = true;

    this.loadCmrcList();

    this.loadVoAlfList();

    this.loadAllGroups();

    this.loadAllWomen();

    this.loadLoans();

  }


  // =====================================================
  // LOAD CMRC
  // =====================================================

  loadCmrcList(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

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
  // LOAD ALL VO / ALF
  // =====================================================

  loadVoAlfList(): void {

    this.voAlfService.getAll().subscribe({

      next: (data: VoAlf[]) => {

        this.voAlfList = data || [];

      },

      error: (error) => {

        console.error(
          'VO / ALF loading error:',
          error
        );

      }

    });

  }


  // =====================================================
  // LOAD VO / ALF BY CMRC
  // =====================================================

  loadVoAlfByCmrc(): void {

    this.selectedVoAlfId = null;
    this.selectedGroupId = null;
    this.selectedWomanId = null;

    this.groupList = [];
    this.womenList = [];

    if (!this.selectedCmrcId) {

      this.resetFundValues();

      this.loadVoAlfList();

      this.applyLoanFilters();

      return;
    }

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          this.resetFundValues();

          this.applyLoanFilters();

          this.cdRef.detectChanges();

        },

        error: (error) => {

          console.error(
            'VO / ALF by CMRC error:',
            error
          );

          this.voAlfList = [];

          this.resetFundValues();

        }

      });

  }


  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    this.selectedGroupId = null;
    this.selectedWomanId = null;

    this.groupList = [];
    this.womenList = [];

    if (!this.selectedVoAlfId) {

      this.resetFundValues();

      this.applyLoanFilters();

      return;
    }

    this.loadGroupsByVoAlf();

    this.calculateFundSummary();

    this.applyLoanFilters();

  }


  // =====================================================
  // LOAD GROUPS BY VO / ALF
  // =====================================================

  loadGroupsByVoAlf(): void {

    if (!this.selectedVoAlfId) {

      this.groupList = [];

      return;
    }

    this.groupService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

          this.applyLoanFilters();

          this.cdRef.detectChanges();

        },

        error: (error) => {

          console.error(
            'Group loading error:',
            error
          );

          this.groupList = [];

        }

      });

  }


  // =====================================================
  // LOAD ALL GROUPS
  // =====================================================

  loadAllGroups(): void {

    this.groupService.getAll().subscribe({

      next: (data: Group[]) => {

        this.groupList = data || [];

      },

      error: (error) => {

        console.error(
          'All groups loading error:',
          error
        );

      }

    });

  }


  // =====================================================
  // GROUP CHANGE
  // =====================================================

  loadWomenByGroup(): void {

    this.selectedWomanId = null;

    this.womenList = [];

    if (!this.selectedGroupId) {

      if (this.selectedVoAlfId) {

        this.loadWomenByVoAlf();

      } else {

        this.loadAllWomen();

      }

      this.applyLoanFilters();

      return;
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

        }

      });

  }


  // =====================================================
  // LOAD WOMEN BY VO / ALF
  // =====================================================

  loadWomenByVoAlf(): void {

    this.womenService.getAll().subscribe({

      next: (data: Women[]) => {

        const allWomen = data || [];

        this.womenList =
          allWomen.filter(
            (woman: any) =>
              Number(woman.voAlfId) ===
              Number(this.selectedVoAlfId)
          );

        this.applyLoanFilters();

      },

      error: (error) => {

        console.error(
          'Women by VO / ALF loading error:',
          error
        );

        this.womenList = [];

      }

    });

  }


  // =====================================================
  // LOAD ALL WOMEN
  // =====================================================

  loadAllWomen(): void {

    this.womenService.getAll().subscribe({

      next: (data: Women[]) => {

        this.womenList = data || [];

      },

      error: (error) => {

        console.error(
          'All women loading error:',
          error
        );

      }

    });

  }


  // =====================================================
  // LOAD ALL LOANS
  // =====================================================

  loadLoans(): void {

    this.loanService.getAll().subscribe({

      next: (data: Loan[]) => {

        this.loanList = data || [];

        this.applyLoanFilters();

        this.calculateFundSummary();

        this.loading = false;

        this.cdRef.detectChanges();

      },

      error: (error) => {

        console.error(
          'Loan loading error:',
          error
        );

        this.loanList = [];
        this.filteredLoanList = [];

        this.loading = false;

      }

    });

  }


  // =====================================================
  // APPLY HIERARCHY + SEARCH FILTER
  // =====================================================

  applyLoanFilters(): void {

    let result = [...this.loanList];


    // ===================================================
    // CMRC FILTER
    // ===================================================

    if (this.selectedCmrcId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.cmrcId) ===
          Number(this.selectedCmrcId)
      );

    }


    // ===================================================
    // VO / ALF FILTER
    // ===================================================

    if (this.selectedVoAlfId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.voAlfId) ===
          Number(this.selectedVoAlfId)
      );

    }


    // ===================================================
    // GROUP FILTER
    // ===================================================

    if (this.selectedGroupId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.groupId) ===
          Number(this.selectedGroupId)
      );

    }


    // ===================================================
    // WOMAN FILTER
    // ===================================================

    if (this.selectedWomanId) {

      result = result.filter(
        (loan: any) =>
          Number(loan.womanId) ===
          Number(this.selectedWomanId)
      );

    }


    // ===================================================
    // SEARCH
    // ===================================================

    const search =
      String(this.globalSearch || '')
        .trim()
        .toLowerCase();

    if (search) {

      result = result.filter(
        (loan: any) => {

          const searchableValues = [

            loan.id,

            loan.cmrcId,
            loan.cmrcName,

            loan.voAlfId,
            loan.voAlfName,

            loan.groupId,
            loan.groupName,

            loan.villageName,

            loan.womanId,
            loan.womanName,

            loan.sanctionedAmount,

            loan.processingFee,

            loan.loanAmount,

            loan.totalAmount,

            loan.loanPurpose,

            loan.loanGivenDate,

            loan.repaymentPeriodMonths,

            loan.interestRate,

            loan.interestType,

            loan.monthlyEmi,

            loan.loanStatus

          ];

          return searchableValues.some(
            (value: any) =>
              String(value ?? '')
                .toLowerCase()
                .includes(search)
          );

        }
      );

    }


    this.filteredLoanList = result;

  }


  // =====================================================
  // SEARCH CHANGE
  // =====================================================

  onSearchChange(): void {

    this.applyLoanFilters();

  }


  // =====================================================
  // FUND SUMMARY
  //
  // LEFT ALF =
  // SELECTED VO/ALF FUND
  // -
  // TOTAL SANCTIONED LOAN AMOUNT
  // =====================================================

  calculateFundSummary(): void {

    if (!this.selectedVoAlfId) {

      this.resetFundValues();

      return;
    }


    // ===================================================
    // SELECTED VO / ALF
    // ===================================================

    const selectedVoAlf: any =
      this.voAlfList.find(
        (vo: any) =>
          Number(vo.id) ===
          Number(this.selectedVoAlfId)
      );


    if (!selectedVoAlf) {

      this.resetFundValues();

      return;
    }


    // ===================================================
    // VO / ALF RECEIVED FUND
    // ===================================================

    this.totalAlfBalance =
      Number(
        selectedVoAlf.receivedFund ??
        selectedVoAlf.recievedFund ??
        selectedVoAlf.alfBalance ??
        selectedVoAlf.balanceAmount ??
        selectedVoAlf.totalAmount ??
        0
      );


    // ===================================================
    // SELECTED VO / ALF LOANS
    // ===================================================

    const voAlfLoans =
      this.loanList.filter(
        (loan: any) =>
          Number(loan.voAlfId) ===
          Number(this.selectedVoAlfId)
      );


    // ===================================================
    // TOTAL SANCTIONED AMOUNT
    // ===================================================

    this.totalSanctionedAmount =
      voAlfLoans.reduce(
        (
          total: number,
          loan: any
        ) => {

          return total +
            (
              Number(
                loan.sanctionedAmount
              ) || 0
            );

        },
        0
      );


    // ===================================================
    // LEFT ALF BALANCE
    // ===================================================

    this.leftAlfBalance =
      this.totalAlfBalance -
      this.totalSanctionedAmount;


    // ===================================================
    // FLOATING POINT PROTECTION
    // ===================================================

    if (
      Math.abs(
        this.leftAlfBalance
      ) < 0.000001
    ) {

      this.leftAlfBalance = 0;

    }

  }


  // =====================================================
  // RESET FUND VALUES
  // =====================================================

  resetFundValues(): void {

    this.totalAlfBalance = 0;

    this.totalSanctionedAmount = 0;

    this.leftAlfBalance = 0;

  }


  // =====================================================
  // EMPTY LOAN
  // =====================================================

  private getEmptyLoan(): any {

    return {

      id: null,

      cmrcId: null,

      voAlfId: null,

      groupId: null,

      womanId: null,

      groupName: '',

      womanName: '',

      sanctionedAmount: 0,

      processingFee: 0,

      totalAmount: 0,

      disbursedAmount: 0,

      loanAmount: 0,

      loanPurpose: '',

      loanGivenDate: '',

      repaymentPeriodMonths: 12,

      interestRate: 0,

      interestType: 'FLAT',

      monthlyEmi: 0,

      loanStatus: 'ACTIVE'

    };

  }


  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  openAddForm(): void {

    if (!this.selectedWomanId) {

      alert(
        'Please select CMRC, VO / ALF, Group and Woman first.'
      );

      return;

    }


    this.isEditMode = false;

    this.editingLoanId = null;

    this.newLoan = this.getEmptyLoan();


    this.newLoan.cmrcId =
      this.selectedCmrcId;

    this.newLoan.voAlfId =
      this.selectedVoAlfId;

    this.newLoan.groupId =
      this.selectedGroupId;

    this.newLoan.womanId =
      this.selectedWomanId;


    this.newLoan.groupName =
      this.getSelectedGroupName();

    this.newLoan.womanName =
      this.getSelectedWomanName();


    this.showForm = true;

    this.scrollToLoanForm();

  }


  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.editingLoanId = null;

    this.newLoan = this.getEmptyLoan();

  }


  // =====================================================
  // CALCULATE DISBURSED AMOUNT
  //
  // DISBURSED = SANCTIONED - PROCESSING FEE
  // =====================================================

  calculateDisbursedAmount(): void {

    const sanctioned =
      Number(
        this.newLoan.sanctionedAmount
      ) || 0;

    const processingFee =
      Number(
        this.newLoan.processingFee
      ) || 0;


    const totalAmount =
      Math.max(
        sanctioned - processingFee,
        0
      );


    this.newLoan.totalAmount =
      totalAmount;

    this.newLoan.disbursedAmount =
      totalAmount;

    this.newLoan.loanAmount =
      totalAmount;


    this.calculateEmi();

  }


  // =====================================================
  // CALCULATE EMI
  // =====================================================

  calculateEmi(): void {

    const principal =
      Number(
        this.newLoan.loanAmount
      ) || 0;

    const months =
      Number(
        this.newLoan.repaymentPeriodMonths
      ) || 0;

    const rate =
      Number(
        this.newLoan.interestRate
      ) || 0;


    if (
      principal <= 0 ||
      months <= 0
    ) {

      this.newLoan.monthlyEmi = 0;

      return;

    }


    // ===================================================
    // FLAT INTEREST
    // ===================================================

    if (
      this.newLoan.interestType ===
      'FLAT'
    ) {

      const totalInterest =
        principal *
        (rate / 100) *
        (months / 12);

      const totalPayable =
        principal +
        totalInterest;

      this.newLoan.monthlyEmi =
        totalPayable / months;

      return;

    }


    // ===================================================
    // REDUCING BALANCE
    // ===================================================

    if (
      this.newLoan.interestType ===
      'REDUCING'
    ) {

      const monthlyRate =
        rate / 12 / 100;


      if (monthlyRate === 0) {

        this.newLoan.monthlyEmi =
          principal / months;

        return;

      }


      const emi =
        principal *
        monthlyRate *
        Math.pow(
          1 + monthlyRate,
          months
        ) /
        (
          Math.pow(
            1 + monthlyRate,
            months
          ) - 1
        );


      this.newLoan.monthlyEmi =
        emi;

    }

  }


  // =====================================================
  // SAVE LOAN
  // =====================================================

  saveLoan(): void {

  if (
    !this.newLoan.cmrcId ||
    !this.newLoan.voAlfId ||
    !this.newLoan.groupId
  ) {
    alert('Please select CMRC, VO / ALF and Group first.');
    return;
  }

  this.loading = true;

  // Make sure woman is NOT mandatory
  const payload: any = {
    ...this.newLoan,

    cmrcId: this.selectedCmrcId,
    voAlfId: this.selectedVoAlfId,
    groupId: this.selectedGroupId,

    // Woman is optional
    womanId: this.newLoan.womanId || null
  };

  // =========================
  // EDIT LOAN
  // =========================
  if (this.isEditMode && this.editingLoanId) {

    this.loanService
      .update(this.editingLoanId, payload)
      .subscribe({
        next: (response) => {

          this.loading = false;

          alert('Loan updated successfully.');

          this.showForm = false;
          this.isEditMode = false;
          this.editingLoanId = null;

          this.loadLoans();
        },

        error: (error) => {

          this.loading = false;

          console.error('Loan update error:', error);

          alert(
            error?.error?.message ||
            'Failed to update loan.'
          );
        }
      });

    return;
  }

  // =========================
  // CREATE NEW LOAN
  // =========================
  this.loanService
    .create(payload)
    .pipe(

      // Loan create hone ke baad loan ID milega
      switchMap((createdLoan: any) => {

        console.log('Loan created:', createdLoan);

        const loanId = Number(createdLoan?.id);

        if (!loanId) {
          throw new Error(
            'Loan created but loan ID was not returned by backend.'
          );
        }

        // Created loan ID ko save kar lein

        // =========================
        // GENERATE CL SCHEDULE
        // =========================
        return this.loanService
          .generateClSchedule(loanId)
          .pipe(

            tap((clSchedule) => {

              console.log(
                'CL Schedule generated:',
                clSchedule
              );

            }),

            // =========================
            // THEN GENERATE REPAYMENT
            // =========================
            switchMap(() => {

              return this.loanService
                .generateRepayment(loanId);

            }),

            tap((repayment) => {

              console.log(
                'Repayment generated:',
                repayment
              );

            })
          );
      })

    )
    .subscribe({

      next: () => {

        this.loading = false;

        alert(
          'Loan created successfully.\n' +
          'CL Schedule generated successfully.\n' +
          'Repayment schedule generated successfully.'
        );

        this.showForm = false;
        this.isEditMode = false;
        this.editingLoanId = null;

        // Reload loan list
        this.loadLoans();
      },

      error: (error) => {

        this.loading = false;

        console.error(
          'Loan / CL Schedule / Repayment generation error:',
          error
        );

        alert(
          error?.error?.message ||
          'Loan created, but CL Schedule or Repayment generation failed.'
        );
      }

    });
}

  // =====================================================
  // EDIT LOAN
  //
  // totalAmount -> disbursedAmount
  // =====================================================

  editLoan(loan: Loan): void {

    this.isEditMode = true;

    this.showForm = true;

    this.editingLoanId =
      loan.id || null;


    const loanAny: any =
      loan as any;


    const totalAmount =
      Number(
        loanAny.totalAmount
      ) ||
      Number(
        loanAny.loanAmount
      ) ||
      0;


    this.newLoan = {

      id:
        loan.id || null,

      cmrcId:
        loan.cmrcId || null,

      voAlfId:
        loan.voAlfId || null,

      groupId:
        loan.groupId || null,

      womanId:
        loan.womanId || null,

      groupName:
        loan.groupName || '',

      womanName:
        loan.womanName || '',

      sanctionedAmount:
        Number(
          loan.sanctionedAmount
        ) || 0,

      processingFee:
        Number(
          loan.processingFee
        ) || 0,

      // ===============================================
      // IMPORTANT
      // ===============================================

      totalAmount:
        totalAmount,

      disbursedAmount:
        totalAmount,

      loanAmount:
        totalAmount,

      loanPurpose:
        loan.loanPurpose || '',

      loanGivenDate:
        loan.loanGivenDate || '',

      repaymentPeriodMonths:
        loan.repaymentPeriodMonths ||
        12,

      interestRate:
        loan.interestRate || 0,

      interestType:
        loan.interestType ||
        'FLAT',

      monthlyEmi:
        loan.monthlyEmi || 0,

      loanStatus:
        loan.loanStatus ||
        'ACTIVE'

    };


    this.calculateEmi();

    this.scrollToLoanForm();

  }


  // =====================================================
  // DELETE LOAN
  // =====================================================

  deleteLoan(id: number): void {

    if (!id) {
      return;
    }


    const confirmed =
      confirm(
        'Are you sure you want to delete this loan?'
      );


    if (!confirmed) {
      return;
    }


    this.loading = true;


    this.loanService
      .delete(id)
      .subscribe({

        next: () => {

          alert(
            'Loan deleted successfully.'
          );


          if (
            this.selectedLoan &&
            this.selectedLoan.id === id
          ) {

            this.selectedLoan = null;

          }


          this.reloadLoans();

        },

        error: (error) => {

          console.error(
            'Loan delete error:',
            error
          );

          this.loading = false;

          alert(
            'Loan delete failed.'
          );

        }

      });

  }


  // =====================================================
  // RELOAD LOANS
  // =====================================================

  reloadLoans(): void {

    this.loanService
      .getAll()
      .subscribe({

        next: (data: Loan[]) => {

          this.loanList =
            data || [];


          this.applyLoanFilters();

          this.calculateFundSummary();

          this.loading = false;

          this.cdRef.detectChanges();

        },

        error: (error) => {

          console.error(
            'Loan reload error:',
            error
          );

          this.loading = false;

        }

      });

  }


  // =====================================================
  // OPEN DETAILS
  //
  // Names are resolved from IDs,
  // NOT from current dropdown selection.
  // =====================================================

  openLoanDetails(loan: Loan): void {

    const loanAny: any =
      loan as any;


    this.selectedLoan = {

      ...loan,

      cmrcName:
        loan.cmrcName ||
        this.getCmrcNameById(
          loan.cmrcId
        ),

      voAlfName:
        loan.voAlfName ||
        this.getVoAlfNameById(
          loan.voAlfId
        ),

      groupName:
        loan.groupName ||
        this.getGroupNameById(
          loan.groupId
        ),

      villageName:
        loan.villageName ||
        loanAny.villageName ||
        ''

    };


    setTimeout(() => {

      const element =
        document.getElementById(
          'loanDetailsSection'
        );


      if (element) {

        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      }

    }, 100);

  }


  // =====================================================
  // CLOSE DETAILS
  // =====================================================

  closeLoanDetails(): void {

    this.selectedLoan = null;

  }


  // =====================================================
  // CMRC NAME BY ID
  // =====================================================

  getCmrcNameById(
    cmrcId?: number | null
  ): string {

    if (!cmrcId) {
      return '';
    }


    const cmrc: any =
      this.cmrcList.find(
        (item: any) =>
          Number(item.id) ===
          Number(cmrcId)
      );


    return cmrc?.cmrcName || '';

  }


  // =====================================================
  // VO / ALF NAME BY ID
  // =====================================================

  getVoAlfNameById(
    voAlfId?: number | null
  ): string {

    if (!voAlfId) {
      return '';
    }


    const voAlf: any =
      this.voAlfList.find(
        (item: any) =>
          Number(item.id) ===
          Number(voAlfId)
      );


    return voAlf?.voAlfName || '';

  }


  // =====================================================
  // GROUP NAME BY ID
  // =====================================================

  getGroupNameById(
    groupId?: number | null
  ): string {

    if (!groupId) {
      return '';
    }


    const group: any =
      this.groupList.find(
        (item: any) =>
          Number(item.id) ===
          Number(groupId)
      );


    return group?.groupName || '';

  }


  // =====================================================
  // SELECTED CMRC NAME
  // =====================================================

  getSelectedCmrcName(): string {

    return this.getCmrcNameById(
      this.selectedCmrcId
    );

  }


  // =====================================================
  // SELECTED VO / ALF NAME
  // =====================================================

  getSelectedVoAlfName(): string {

    return this.getVoAlfNameById(
      this.selectedVoAlfId
    );

  }


  // =====================================================
  // SELECTED GROUP NAME
  // =====================================================

  getSelectedGroupName(): string {

    return this.getGroupNameById(
      this.selectedGroupId
    );

  }


  // =====================================================
  // SELECTED WOMAN NAME
  // =====================================================

  getSelectedWomanName(): string {

    if (!this.selectedWomanId) {
      return '';
    }


    const woman: any =
      this.womenList.find(
        (item: any) =>
          Number(item.id) ===
          Number(this.selectedWomanId)
      );


    return woman?.womanName || '';

  }


  // =====================================================
  // SELECTED VILLAGE
  // =====================================================

  getSelectedVillageName(): string {
  if (!this.selectedVoAlfId) {
    return '';
  }

  // Selected VO/ALF ke groups find karo
  const groups = this.groupList.filter(
    group => group.voAlfId === this.selectedVoAlfId
  );

  if (!groups.length) {
    return '';
  }

  // First available village
  const village = groups.find(
    group => group.villageName && group.villageName.trim() !== ''
  );

  return village?.villageName || '';
}


  // =====================================================
  // TOTAL LOAN AMOUNT
  // FILTERED RECORDS
  // =====================================================

  getTotalLoanAmount(): number {

    return this.filteredLoanList.reduce(
      (
        total: number,
        loan: any
      ) => {

        return total +
          (
            Number(
              loan.loanAmount
            ) || 0
          );

      },
      0
    );

  }


  // =====================================================
  // TOTAL SANCTIONED
  // FILTERED RECORDS
  // =====================================================

  getTotalSanctionedAmount(): number {

    return this.filteredLoanList.reduce(
      (
        total: number,
        loan: any
      ) => {

        return total +
          (
            Number(
              loan.sanctionedAmount
            ) || 0
          );

      },
      0
    );

  }


  // =====================================================
  // TOTAL PROCESSING FEE
  // =====================================================

  getTotalProcessingFee(): number {

    return this.filteredLoanList.reduce(
      (
        total: number,
        loan: any
      ) => {

        return total +
          (
            Number(
              loan.processingFee
            ) || 0
          );

      },
      0
    );

  }


  // =====================================================
  // TOTAL DISBURSED
  // =====================================================

  getTotalDisbursedAmount(): number {

    return this.filteredLoanList.reduce(
      (
        total: number,
        loan: any
      ) => {

        const amount =
          Number(
            loan.totalAmount
          ) ||
          Number(
            loan.loanAmount
          ) ||
          0;

        return total + amount;

      },
      0
    );

  }


  // =====================================================
  // TOTAL MONTHLY EMI
  // =====================================================

  getTotalMonthlyEmi(): number {

    return this.filteredLoanList.reduce(
      (
        total: number,
        loan: any
      ) => {

        return total +
          (
            Number(
              loan.monthlyEmi
            ) || 0
          );

      },
      0
    );

  }


  // =====================================================
  // SCROLL TO FORM
  // =====================================================

  private scrollToLoanForm(): void {

    setTimeout(() => {

      const element =
        document.getElementById(
          'loanFormSection'
        );


      if (element) {

        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      }

    }, 100);

  }


  // =====================================================
  // NUMBER TO WORDS
  // =====================================================

  numberToWords(
    amount: number
  ): string {

    if (
      amount === null ||
      amount === undefined ||
      Number(amount) === 0
    ) {

      return '';

    }


    const num =
      Math.floor(
        Number(amount)
      );


    if (num > 999999999) {

      return '';

    }


    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    ];


    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety'
    ];


    const convertBelowThousand =
      (n: number): string => {

        let result = '';


        if (n >= 100) {

          result +=
            ones[
              Math.floor(n / 100)
            ] +
            ' Hundred ';

          n %= 100;

        }


        if (n >= 20) {

          result +=
            tens[
              Math.floor(n / 10)
            ] +
            ' ';

          n %= 10;

        }


        if (n > 0) {

          result +=
            ones[n] +
            ' ';

        }


        return result.trim();

      };


    let result = '';


    const lakhs =
      Math.floor(
        num / 100000
      );

    const remainderAfterLakhs =
      num % 100000;


    if (lakhs > 0) {

      result +=
        convertBelowThousand(
          lakhs
        ) +
        ' Lakh ';

    }


    const thousands =
      Math.floor(
        remainderAfterLakhs / 1000
      );

    const remainder =
      remainderAfterLakhs % 1000;


    if (thousands > 0) {

      result +=
        convertBelowThousand(
          thousands
        ) +
        ' Thousand ';

    }


    if (remainder > 0) {

      result +=
        convertBelowThousand(
          remainder
        );

    }


    return result.trim() + ' Rupees Only';

  }


  // =====================================================
  // EXPORT
  // =====================================================

  exportToExcel(): void {

    /*
     * Existing export implementation
     * can remain here.
     *
     * If your previous component already had
     * exportToExcel(), keep that implementation.
     */

    console.log(
      'Export requested:',
      this.filteredLoanList
    );

  }
  

}