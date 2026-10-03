import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import {
  Input,
  Output,
  EventEmitter
} from '@angular/core';
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

import {
  Loan,
  LoanImage,
  LoanService
} from '../services/loan.service';

import {
  ClScheduleService
} from '../services/cl-schedule.service';

import {
  RepaymentService
} from '../services/repayment.service';


@Component({
  selector: 'app-loan-management',
  templateUrl: './loan-management.component.html',
  styleUrls: ['./loan-management.component.css']
})
export class LoanManagementComponent implements OnInit {

  // =========================================================
  // MASTER DATA
  // =========================================================

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  groupList: Group[] = [];
  womenList: Women[] = [];

  loanList: Loan[] = [];
  filteredLoanList: Loan[] = [];


  // =========================================================
  // SELECTED FILTERS
  // =========================================================

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;
  selectedGroupId: number | null = null;
  selectedWomanId: number | null = null;


  // =========================================================
  // FUND SUMMARY
  // =========================================================

  totalAlfBalance = 0;
  totalSanctionedAmount = 0;
  leftAlfBalance = 0;


  // =========================================================
  // FORM
  // =========================================================

  showForm = false;
  isEditMode = false;
  editingLoanId: number | null = null;

  newLoan: any = this.getEmptyLoan();


  // =========================================================
  // SELECTED LOAN
  // =========================================================

  selectedLoan: Loan | null = null;


  // =========================================================
  // SEARCH
  // =========================================================

  globalSearch = '';


  // =========================================================
  // LOAN IMAGES
  // =========================================================

  selectedImageFiles: File[] = [];
  imagePreviews: string[] = [];
  loanImages: LoanImage[] = [];
  imageUploading = false;


  // =========================================================
  // LOADING
  // =========================================================

  loading = false;


  // =========================================================
  // CL SCHEDULE POPUP
  // =========================================================

  showClSchedulePopup = false;
  selectedClScheduleLoanId: number | null = null;


  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService,
    private loanService: LoanService,
    private clScheduleService: ClScheduleService,
    private repaymentService: RepaymentService,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadCmrcList();
    this.loadAllLoans();
  }


  // =========================================================
  // CMRC
  // =========================================================

loadCmrcList(): void {

  this.cmrcService.getAll().subscribe({
    next: (data: Cmrc[]) => {

      this.cmrcList = data || [];

      // =====================================================
      // DEFAULT CMRC SELECTION
      // Select first CMRC automatically
      // =====================================================

      if (
        this.cmrcList.length > 0 &&
        !this.selectedCmrcId
      ) {

        this.selectedCmrcId =
          Number(this.cmrcList[0].id);

        // Load VO / ALF for selected CMRC
        if (this.selectedCmrcId) {

          this.loadVoAlfByCmrc(
            this.selectedCmrcId
          );

        }

        // Apply CMRC filter immediately
        this.applyLoanFilters();

      }

    },

    error: (error: any) => {

      console.error(
        'Error loading CMRC list:',
        error
      );

      this.cmrcList = [];

    }
  });

}


  // =========================================================
  // VO / ALF
  // =========================================================

  loadVoAlfByCmrc(cmrcId: number): void {

    this.voAlfService.getByCmrcId(cmrcId).subscribe({
      next: (data: VoAlf[]) => {
        this.voAlfList = data || [];
      },
      error: (error: any) => {
        console.error('Error loading VO / ALF:', error);
        this.voAlfList = [];
      }
    });

  }


  // =========================================================
  // GROUP
  // =========================================================

  loadGroupsByVoAlf(voAlfId: number): void {

    this.groupService.getByVoAlfId(voAlfId).subscribe({
      next: (data: Group[]) => {
        this.groupList = data || [];
      },
      error: (error: any) => {
        console.error('Error loading groups:', error);
        this.groupList = [];
      }
    });

  }


  // =========================================================
  // WOMEN
  // =========================================================

  loadWomenByGroup(groupId: number): void {

    this.womenService.getByGroupId(groupId).subscribe({
      next: (data: Women[]) => {
        this.womenList = data || [];
      },
      error: (error: any) => {
        console.error('Error loading women:', error);
        this.womenList = [];
      }
    });

  }


  // =========================================================
  // LOANS
  // =========================================================

  loadAllLoans(): void {

    this.loading = true;

    this.loanService.getAll().subscribe({
      next: (data: Loan[]) => {

        this.loanList = data || [];

        this.applyLoanFilters();

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error: any) => {

        console.error('Error loading loans:', error);

        this.loanList = [];
        this.filteredLoanList = [];

        this.loading = false;

        this.cdr.detectChanges();
      }
    });

  }


  // =========================================================
  // FILTER RESET
  // =========================================================

  clearFilters(): void {

    this.selectedCmrcId = null;
    this.selectedVoAlfId = null;
    this.selectedGroupId = null;
    this.selectedWomanId = null;

    this.voAlfList = [];
    this.groupList = [];
    this.womenList = [];

    this.totalAlfBalance = 0;
    this.totalSanctionedAmount = 0;
    this.leftAlfBalance = 0;

    this.applyLoanFilters();

  }


  // =========================================================
  // CMRC CHANGE
  // =========================================================

  onCmrcChange(): void {

    this.selectedVoAlfId = null;
    this.selectedGroupId = null;
    this.selectedWomanId = null;

    this.voAlfList = [];
    this.groupList = [];
    this.womenList = [];

    this.totalAlfBalance = 0;
    this.totalSanctionedAmount = 0;
    this.leftAlfBalance = 0;

    if (this.selectedCmrcId) {
      this.loadVoAlfByCmrc(this.selectedCmrcId);
    }

    this.applyLoanFilters();

  }


  // =========================================================
  // VO / ALF CHANGE
  // =========================================================

  onVoAlfChange(): void {

    this.selectedGroupId = null;
    this.selectedWomanId = null;

    this.groupList = [];
    this.womenList = [];

    this.updateAlfBalance();

    if (this.selectedVoAlfId) {
      this.loadGroupsByVoAlf(this.selectedVoAlfId);
    }

    this.applyLoanFilters();

  }


  // =========================================================
  // GROUP CHANGE
  // =========================================================

  onGroupChange(): void {

    this.selectedWomanId = null;
    this.womenList = [];

    if (this.selectedGroupId) {
      this.loadWomenByGroup(this.selectedGroupId);
    }

    this.applyLoanFilters();

  }


  // =========================================================
  // WOMAN CHANGE
  // =========================================================

  onWomanChange(): void {
    this.applyLoanFilters();
  }


  // =========================================================
  // LOAN FILTER
  // =========================================================

  applyLoanFilters(): void {

    let result = [...this.loanList];


    if (this.selectedCmrcId) {
      result = result.filter(
        loan =>
          Number(loan.cmrcId) === Number(this.selectedCmrcId)
      );
    }


    if (this.selectedVoAlfId) {
      result = result.filter(
        loan =>
          Number(loan.voAlfId) === Number(this.selectedVoAlfId)
      );
    }


    if (this.selectedGroupId) {
      result = result.filter(
        loan =>
          Number(loan.groupId) === Number(this.selectedGroupId)
      );
    }


    if (this.selectedWomanId) {
      result = result.filter(
        loan =>
          Number(loan.womanId) === Number(this.selectedWomanId)
      );
    }


    if (this.globalSearch.trim()) {

      const search =
        this.globalSearch.trim().toLowerCase();

      result = result.filter((loan: Loan) => {

        return (
          String(loan.id || '')
            .toLowerCase()
            .includes(search) ||

          String(loan.cmrcName || '')
            .toLowerCase()
            .includes(search) ||

          String(loan.voAlfName || '')
            .toLowerCase()
            .includes(search) ||

          String(loan.groupName || '')
            .toLowerCase()
            .includes(search) ||

          String(loan.womanName || '')
            .toLowerCase()
            .includes(search) ||

          String(loan.loanPurpose || '')
            .toLowerCase()
            .includes(search)
        );

      });

    }


    this.filteredLoanList = result;

    this.calculateLoanSummary();

  }


  // =========================================================
  // SEARCH
  // =========================================================

  onGlobalSearch(): void {
    this.applyLoanFilters();
  }


  applyGlobalSearch(): void {
    this.applyLoanFilters();
  }


  // =========================================================
  // FUND SUMMARY
  // =========================================================

  updateAlfBalance(): void {

    this.totalAlfBalance = 0;

    if (!this.selectedVoAlfId) {

      this.totalSanctionedAmount = 0;
      this.leftAlfBalance = 0;

      return;
    }


    const selectedVoAlf =
      this.voAlfList.find(
        vo =>
          Number(vo.id) ===
          Number(this.selectedVoAlfId)
      );


    if (selectedVoAlf) {

      this.totalAlfBalance =
        Number(
          selectedVoAlf.receivedFund ||
          (selectedVoAlf as any).recievedFund ||
          (selectedVoAlf as any).alfBalance ||
          (selectedVoAlf as any).balanceAmount ||
          (selectedVoAlf as any).totalAmount ||
          0
        );

    }


    this.calculateLoanSummary();

  }


  calculateLoanSummary(): void {

    if (!this.selectedVoAlfId) {

      this.totalSanctionedAmount = 0;
      this.leftAlfBalance = 0;

      return;
    }


    const loans =
      this.loanList.filter(
        loan =>
          Number(loan.voAlfId) ===
          Number(this.selectedVoAlfId)
      );


    this.totalSanctionedAmount =
      loans.reduce(
        (total: number, loan: Loan) =>
          total + this.getSanctionedAmount(loan),
        0
      );


    this.leftAlfBalance =
      this.totalAlfBalance -
      this.totalSanctionedAmount;

  }


  // =========================================================
  // AMOUNT HELPERS
  // =========================================================

  getSanctionedAmount(
    loan: Loan | null | undefined
  ): number {

    return Number(
      loan?.sanctionedAmount ||
      loan?.totalAmount ||
      loan?.loanAmount ||
      0
    );

  }


  getDisbursedAmount(
    loan: Loan | null | undefined
  ): number {

    return Number(
      loan?.loanAmount ||
      loan?.totalAmount ||
      0
    );

  }


  getTotalSanctionedAmount(): number {

    return this.filteredLoanList.reduce(
      (total: number, loan: Loan) =>
        total + Number(loan.sanctionedAmount || 0),
      0
    );

  }


  getTotalProcessingFee(): number {

    return this.filteredLoanList.reduce(
      (total: number, loan: Loan) =>
        total + Number(loan.processingFee || 0),
      0
    );

  }


  getTotalMonthlyEmi(): number {

    return this.filteredLoanList.reduce(
      (total: number, loan: Loan) =>
        total + Number(loan.monthlyEmi || 0),
      0
    );

  }


  getTotalLoanAmount(): number {

    return this.filteredLoanList.reduce(
      (total: number, loan: Loan) => {

        return total +
          Number(
            loan.loanAmount ||
            loan.totalAmount ||
            0
          );

      },
      0
    );

  }


  // =========================================================
  // CMRC / VO / VILLAGE HELPERS
  // =========================================================

  getSelectedCmrcName(): string {

    if (!this.selectedCmrcId) {
      return '';
    }

    const cmrc =
      this.cmrcList.find(
        item =>
          Number(item.id) ===
          Number(this.selectedCmrcId)
      );

    return cmrc?.cmrcName || '';

  }


  getCmrcNameById(
    cmrcId: number | undefined
  ): string {

    if (cmrcId == null) {
      return '-';
    }

    const cmrc =
      this.cmrcList.find(
        item =>
          Number(item.id) ===
          Number(cmrcId)
      );

    return cmrc?.cmrcName || '-';

  }


  getSelectedVoAlfName(): string {

    if (!this.selectedVoAlfId) {
      return '';
    }

    const voAlf =
      this.voAlfList.find(
        item =>
          Number(item.id) ===
          Number(this.selectedVoAlfId)
      );

    return voAlf?.voAlfName || '';

  }


  getSelectedVillageName(): string {

    if (!this.selectedVoAlfId) {
      return '';
    }

    const voAlf =
      this.voAlfList.find(
        item =>
          Number(item.id) ===
          Number(this.selectedVoAlfId)
      );

    return voAlf?.villageName || '';

  }


  getFormVillageName(): string {

    const voAlfId =
      this.newLoan?.voAlfId;

    if (!voAlfId) {
      return '';
    }

    const voAlf =
      this.voAlfList.find(
        item =>
          Number(item.id) ===
          Number(voAlfId)
      );

    return voAlf?.villageName || '';

  }


  // =========================================================
  // EMPTY LOAN
  // =========================================================

  getEmptyLoan(): any {

    return {

      cmrcId: null,
      voAlfId: null,
      groupId: null,
      womanId: null,

      cmrcName: '',
      voAlfName: '',
      groupName: '',
      womanName: '',
      villageName: '',

      sanctionedAmount: 0,
      processingFee: 0,
      totalAmount: 0,
      loanAmount: 0,

      loanPurpose: '',
      loanGivenDate: this.getTodayDate(),

      repaymentPeriodMonths: 12,

      interestRate: 0,
      interestType: 'FLAT',

      monthlyEmi: 0,

      loanStatus: 'ACTIVE'

    };

  }


  getTodayDate(): string {

    const date = new Date();

    const year = date.getFullYear();

    const month =
      String(date.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(date.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;

  }


  // =========================================================
  // FORM CMRC CHANGE
  // =========================================================

  onFormCmrcChange(): void {

    this.newLoan.voAlfId = null;
    this.newLoan.groupId = null;
    this.newLoan.womanId = null;

    this.newLoan.cmrcName = '';
    this.newLoan.voAlfName = '';
    this.newLoan.groupName = '';
    this.newLoan.womanName = '';
    this.newLoan.villageName = '';

    this.voAlfList = [];
    this.groupList = [];
    this.womenList = [];

    if (this.newLoan.cmrcId) {

      const cmrc =
        this.cmrcList.find(
          item =>
            Number(item.id) ===
            Number(this.newLoan.cmrcId)
        );

      this.newLoan.cmrcName =
        cmrc?.cmrcName || '';

      this.loadVoAlfByCmrc(
        Number(this.newLoan.cmrcId)
      );

    }

  }


  // =========================================================
  // FORM VO / ALF CHANGE
  // =========================================================

  onFormVoAlfChange(): void {

    this.newLoan.groupId = null;
    this.newLoan.womanId = null;

    this.newLoan.groupName = '';
    this.newLoan.womanName = '';

    this.groupList = [];
    this.womenList = [];

    const voAlf =
      this.voAlfList.find(
        item =>
          Number(item.id) ===
          Number(this.newLoan.voAlfId)
      );

    this.newLoan.voAlfName =
      voAlf?.voAlfName || '';

    this.newLoan.villageName =
      voAlf?.villageName || '';

    if (this.newLoan.voAlfId) {

      this.loadGroupsByVoAlf(
        Number(this.newLoan.voAlfId)
      );

    }

  }


  // =========================================================
  // FORM GROUP CHANGE
  // =========================================================

  onFormGroupChange(): void {

    this.newLoan.womanId = null;
    this.newLoan.womanName = '';

    this.womenList = [];

    const group =
      this.groupList.find(
        item =>
          Number(item.id) ===
          Number(this.newLoan.groupId)
      );

    this.newLoan.groupName =
      group?.groupName || '';

    if (this.newLoan.groupId) {

      this.loadWomenByGroup(
        Number(this.newLoan.groupId)
      );

    }

  }


  // =========================================================
  // ADD FORM
  // =========================================================

  openAddForm(): void {

    this.isEditMode = false;
    this.editingLoanId = null;

    this.newLoan =
      this.getEmptyLoan();

    this.newLoan.cmrcId =
      this.selectedCmrcId;

    this.newLoan.voAlfId =
      this.selectedVoAlfId;

    this.newLoan.groupId =
      this.selectedGroupId;

    this.newLoan.womanId =
      this.selectedWomanId;


    this.newLoan.cmrcName =
      this.getSelectedCmrcName();

    this.newLoan.voAlfName =
      this.getSelectedVoAlfName();

    this.newLoan.villageName =
      this.getSelectedVillageName();


    const group =
      this.groupList.find(
        item =>
          Number(item.id) ===
          Number(this.selectedGroupId)
      );

    this.newLoan.groupName =
      group?.groupName || '';


    const woman =
      this.womenList.find(
        item =>
          Number(item.id) ===
          Number(this.selectedWomanId)
      );

    this.newLoan.womanName =
      woman?.womanName || '';


    this.showForm = true;

  }


  // =========================================================
  // EDIT FORM
  // =========================================================

  openEditForm(loan: Loan): void {

    if (!loan?.id) {
      return;
    }

    this.isEditMode = true;

    this.editingLoanId =
      Number(loan.id);

    this.newLoan = {
      ...loan
    };

    this.calculateDisbursedAmount();

    this.showForm = true;


    if (loan.cmrcId) {

      this.loadVoAlfByCmrc(
        Number(loan.cmrcId)
      );

    }

    if (loan.voAlfId) {

      this.loadGroupsByVoAlf(
        Number(loan.voAlfId)
      );

    }

    if (loan.groupId) {

      this.loadWomenByGroup(
        Number(loan.groupId)
      );

    }

  }


  // HTML compatibility
  editLoan(loan: Loan): void {
    this.openEditForm(loan);
  }


  // =========================================================
  // CLOSE FORM
  // =========================================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.editingLoanId = null;

    this.newLoan =
      this.getEmptyLoan();

    this.clearImageSelection();

  }


  // =========================================================
  // CALCULATE DISBURSED AMOUNT
  // =========================================================

  calculateDisbursedAmount(): void {

    const sanctioned =
      Number(
        this.newLoan?.sanctionedAmount || 0
      );

    const processingFee =
      Number(
        this.newLoan?.processingFee || 0
      );

    const amount =
      sanctioned - processingFee;


    this.newLoan.totalAmount =
      amount;

    this.newLoan.loanAmount =
      amount;

    this.newLoan.disbursedAmount =
      amount;

  }


  // =========================================================
  // CALCULATE EMI
  // =========================================================

  calculateEmi(): void {

    const principal =
      Number(
        this.newLoan?.loanAmount || 0
      );

    const months =
      Number(
        this.newLoan?.repaymentPeriodMonths || 0
      );

    const rate =
      Number(
        this.newLoan?.interestRate || 0
      );


    if (
      principal <= 0 ||
      months <= 0
    ) {

      this.newLoan.monthlyEmi = 0;

      return;
    }


    if (
      !this.newLoan.interestType ||
      this.newLoan.interestType === 'FLAT'
    ) {

      const totalInterest =
        principal *
        rate *
        months /
        100;

      const totalPayable =
        principal +
        totalInterest;

      this.newLoan.monthlyEmi =
        totalPayable / months;

      return;
    }


    if (
      this.newLoan.interestType === 'REDUCING'
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


  // =========================================================
  // SAVE LOAN
  // =========================================================

  saveLoan(): void {

    this.calculateDisbursedAmount();
    this.calculateEmi();


    // Keep display values synchronized
    this.newLoan.cmrcName =
      this.getCmrcNameById(
        this.newLoan.cmrcId
      );

    this.newLoan.voAlfName =
      this.getVoAlfNameById(
        this.newLoan.voAlfId
      );

    this.newLoan.villageName =
      this.getVillageNameByVoAlfId(
        this.newLoan.voAlfId
      );


    const group =
      this.groupList.find(
        item =>
          Number(item.id) ===
          Number(this.newLoan.groupId)
      );

    this.newLoan.groupName =
      group?.groupName || '';


    const woman =
      this.womenList.find(
        item =>
          Number(item.id) ===
          Number(this.newLoan.womanId)
      );

    this.newLoan.womanName =
      woman?.womanName || '';


    // =======================================================
    // UPDATE
    // =======================================================

    if (
      this.isEditMode &&
      this.editingLoanId
    ) {

      this.loanService.update(
        this.editingLoanId,
        this.newLoan
      ).subscribe({

        next: () => {

          this.closeForm();

          this.loadAllLoans();

        },

        error: (error: any) => {

          console.error(
            'Error updating loan:',
            error
          );

          alert(
            'Failed to update loan.'
          );

        }

      });

      return;
    }


    // =======================================================
    // CREATE
    // =======================================================

    this.loanService.create(
      this.newLoan
    ).subscribe({

      next: (createdLoan: Loan) => {

        const loanId =
          Number(createdLoan?.id);


        if (!loanId) {

          alert(
            'Loan created but Loan ID was not returned.'
          );

          this.closeForm();
          this.loadAllLoans();

          return;
        }


        if (
          this.selectedImageFiles.length > 0
        ) {

          this.uploadLoanImages(
            loanId,
            () =>
              this.generateLoanSchedules(
                loanId
              )
          );

        } else {

          this.generateLoanSchedules(
            loanId
          );

        }


        this.closeForm();

        this.loadAllLoans();

      },

      error: (error: any) => {

        console.error(
          'Error creating loan:',
          error
        );

        alert(
          'Failed to create loan.'
        );

      }

    });

  }


  // =========================================================
  // GENERATE CL + REPAYMENT
  // =========================================================

  generateLoanSchedules(
    loanId: number
  ): void {

    if (!loanId) {
      return;
    }


    this.loanService.generateClSchedule(
      loanId
    ).subscribe({

      next: () => {

        this.loanService.generateRepayment(
          loanId
        ).subscribe({

          next: () => {

            console.log(
              'CL schedule and repayment generated.'
            );

          },

          error: (error: any) => {

            console.error(
              'Repayment generation failed:',
              error
            );

          }

        });

      },

      error: (error: any) => {

        console.error(
          'CL schedule generation failed:',
          error
        );


        // Keep repayment generation even if CL fails
        this.loanService.generateRepayment(
          loanId
        ).subscribe({

          next: () => {},

          error: (repaymentError: any) => {

            console.error(
              'Repayment generation failed:',
              repaymentError
            );

          }

        });

      }

    });

  }


  // =========================================================
  // DELETE LOAN
  // =========================================================

  deleteLoan(
    loanOrId: Loan | number
  ): void {

    const id =
      typeof loanOrId === 'number'
        ? loanOrId
        : Number(loanOrId?.id);


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


    this.loanService.delete(id).subscribe({

      next: () => {

        this.loadAllLoans();

      },

      error: (error: any) => {

        console.error(
          'Error deleting loan:',
          error
        );

        alert(
          'Failed to delete loan.'
        );

      }

    });

  }


  // =========================================================
  // LOAN DETAILS
  // =========================================================

  viewLoanDetails(
    loan: Loan
  ): void {

    if (!loan) {
      return;
    }

    this.selectedLoan =
      loan;

    this.clearImageSelection();

    this.loanImages = [];

    if (loan.id) {

      this.loadLoanImages(
        Number(loan.id)
      );

    }

  }


  closeLoanDetails(): void {

    this.selectedLoan = null;

    this.loanImages = [];

    this.clearImageSelection();

  }


  // =========================================================
  // CL SCHEDULE POPUP
  // =========================================================

  openClSchedulePopup(
    loan: Loan
  ): void {

    if (!loan || !loan.id) {

      alert(
        'Loan ID is not available.'
      );

      return;
    }


    this.selectedClScheduleLoanId =
      Number(loan.id);

    this.showClSchedulePopup =
      true;

    this.cdr.detectChanges();

  }


  closeClSchedulePopup(): void {

    this.showClSchedulePopup =
      false;

    this.selectedClScheduleLoanId =
      null;

  }


  // =========================================================
  // IMAGE SELECTION
  // =========================================================

  onImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }


    this.selectedImageFiles =
      Array.from(input.files);

    this.imagePreviews = [];


    this.selectedImageFiles.forEach(
      (file: File) => {

        const reader =
          new FileReader();

        reader.onload =
          () => {

            this.imagePreviews.push(
              String(reader.result)
            );

          };

        reader.readAsDataURL(file);

      }
    );

  }


  // HTML compatibility
  onLoanImagesSelected(
    event: Event
  ): void {

    this.onImageSelected(event);

  }


  removeSelectedImage(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.selectedImageFiles.length
    ) {
      return;
    }


    this.selectedImageFiles.splice(
      index,
      1
    );

    this.imagePreviews.splice(
      index,
      1
    );

  }


  clearImageSelection(): void {

    this.selectedImageFiles = [];

    this.imagePreviews = [];

  }


  // =========================================================
  // UPLOAD IMAGES
  // =========================================================

  uploadLoanImages(
    loanId?: number,
    callback?: () => void
  ): void {

    // If called without ID from the details screen
    if (!loanId) {

      loanId =
        Number(
          this.selectedLoan?.id ||
          this.editingLoanId ||
          0
        );

    }


    if (
      !loanId ||
      this.selectedImageFiles.length === 0
    ) {

      if (callback) {
        callback();
      }

      return;
    }


    this.imageUploading =
      true;


    this.loanService.uploadImages(
      loanId,
      this.selectedImageFiles
    ).subscribe({

      next: (
        images: LoanImage[]
      ) => {

        this.loanImages =
          images || [];

        this.imageUploading =
          false;

        this.clearImageSelection();


        if (callback) {
          callback();
        }

      },

      error: (error: any) => {

        console.error(
          'Image upload failed:',
          error
        );

        this.imageUploading =
          false;


        if (callback) {
          callback();
        }

      }

    });

  }


  // =========================================================
  // LOAD LOAN IMAGES
  // =========================================================

  loadLoanImages(
    loanId: number
  ): void {

    if (!loanId) {
      return;
    }


    this.loanService.getImagesByLoan(
      loanId
    ).subscribe({

      next: (
        images: LoanImage[]
      ) => {

        this.loanImages =
          images || [];

      },

      error: (error: any) => {

        console.error(
          'Error loading loan images:',
          error
        );

        this.loanImages = [];

      }

    });

  }


  // =========================================================
  // IMAGE URL HELPERS
  // =========================================================

  getImageViewUrl(
    imageId: number
  ): string {

    return this.loanService.getImageViewUrl(
      Number(imageId)
    );

  }


  getImageDownloadUrl(
    imageId: number
  ): string {

    return this.loanService.getImageDownloadUrl(
      Number(imageId)
    );

  }


  // =========================================================
  // DELETE IMAGE
  // =========================================================

deleteLoanImage(image: LoanImage): void {

  if (!image?.id) {
    return;
  }

  const confirmed = confirm(
    'Are you sure you want to delete this image?'
  );

  if (!confirmed) {
    return;
  }

  const imageId = Number(image.id);

  this.loanService.deleteImage(imageId).subscribe({

    next: () => {

      // Remove immediately from UI
      this.loanImages = this.loanImages.filter(
        item =>
          Number(item.id) !== imageId
      );

      // Clear image selection if required
      this.clearImageSelection();

      console.log(
        'Loan image deleted successfully:',
        imageId
      );
    },

    error: (error: any) => {

      console.error(
        'Delete image API error:',
        error
      );

      /*
       * Some Spring Boot DELETE APIs may delete successfully
       * but Angular can still receive an unexpected response.
       *
       * Check the actual Network response before showing
       * failure to the user.
       */

      if (
        error?.status === 200 ||
        error?.status === 204
      ) {

        this.loanImages = this.loanImages.filter(
          item =>
            Number(item.id) !== imageId
        );

        return;
      }

      alert(
        'Failed to delete image.'
      );

    }

  });

}



  // =========================================================
  // NUMBER TO WORDS
  // =========================================================

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


    if (num < 0) {

      return 'Minus ' +
        this.numberToWords(
          Math.abs(num)
        );

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
            ];

          if (n % 10 !== 0) {

            result +=
              ' ' +
              ones[n % 10];

          }

        } else if (n > 0) {

          result +=
            ones[n];

        }


        return result.trim();

      };


    let result = '';


    if (num >= 10000000) {

      result +=
        convertBelowThousand(
          Math.floor(
            num / 10000000
          )
        ) +
        ' Crore ';

    }


    const croreRemainder =
      num % 10000000;


    if (croreRemainder >= 100000) {

      result +=
        convertBelowThousand(
          Math.floor(
            croreRemainder / 100000
          )
        ) +
        ' Lakh ';

    }


    const lakhRemainder =
      croreRemainder % 100000;


    if (lakhRemainder >= 1000) {

      result +=
        convertBelowThousand(
          Math.floor(
            lakhRemainder / 1000
          )
        ) +
        ' Thousand ';

    }


    const thousandRemainder =
      lakhRemainder % 1000;


    if (thousandRemainder > 0) {

      result +=
        convertBelowThousand(
          thousandRemainder
        );

    }


    return result.trim() +
      ' Rupees Only';

  }


  // =========================================================
  // NAME HELPERS
  // =========================================================

  getVoAlfNameById(
    voAlfId: number | null | undefined
  ): string {

    if (voAlfId == null) {
      return '';
    }


    const voAlf =
      this.voAlfList.find(
        item =>
          Number(item.id) ===
          Number(voAlfId)
      );


    return voAlf?.voAlfName || '';

  }


  getVillageNameByVoAlfId(
    voAlfId: number | null | undefined
  ): string {

    if (voAlfId == null) {
      return '';
    }


    const voAlf =
      this.voAlfList.find(
        item =>
          Number(item.id) ===
          Number(voAlfId)
      );


    return voAlf?.villageName || '';

  }


  // =========================================================
  // TRACK BY
  // =========================================================

  trackByLoanId(
    index: number,
    loan: Loan
  ): number {

    return Number(
      loan.id || index
    );

  }

}