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
  LoanService,
  LoanImage
} from '../services/loan.service';

import {
  ClScheduleService
} from '../services/cl-schedule.service';

import {
  RepaymentService
} from '../services/repayment.service';

import {
  DomSanitizer,
  SafeUrl
} from '@angular/platform-browser';


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
  // LOAN IMAGES
  // =====================================================

  selectedImageFiles: File[] = [];

  imagePreviews: string[] = [];

  loanImages: LoanImage[] = [];

  imageUploading = false;


  // =====================================================
  // LOADING
  // =====================================================

  loading = false;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService,
    private loanService: LoanService,
    private cdRef: ChangeDetectorRef,
    private clScheduleService: ClScheduleService,
    private repaymentService: RepaymentService,
    private sanitizer: DomSanitizer
  ) {}


  // =====================================================
  // SAFE IMAGE URL
  // =====================================================

  getSafeImageUrl(url: string): SafeUrl {

    return this.sanitizer.bypassSecurityTrustUrl(url);

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadInitialData();

  }


  // =====================================================
  // INITIAL DATA
  //
  // LOGGED-IN USER
  //       ↓
  //      CMRC
  //       ↓
  //    VO / ALF
  //       ↓
  //     GROUP
  //       ↓
  //     WOMEN
  //       ↓
  //      LOAN
  // =====================================================

  loadInitialData(): void {

    this.loading = true;


    // Load logged-in user's CMRC first.
    this.loadCmrcList();


    // Loans are already secured by backend
    // for the logged-in user's CMRC.
    this.loadLoans();

  }


  // =====================================================
  // LOAD CURRENT USER CMRC
  // =====================================================

  loadCmrcList(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];


        // Backend returns only the CMRC
        // assigned to logged-in user.

        if (this.cmrcList.length === 0) {

          this.selectedCmrcId = null;

          this.voAlfList = [];

          this.groupList = [];

          this.womenList = [];

          return;

        }


        const currentCmrc =
          this.cmrcList[0];


        this.selectedCmrcId =
          currentCmrc.id != null
            ? Number(currentCmrc.id)
            : null;


        console.log(
          'CURRENT USER CMRC:',
          currentCmrc
        );


        if (this.selectedCmrcId !== null) {

          this.loadVoAlfByCmrc();

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

        this.groupList = [];

        this.womenList = [];

      }

    });

  }


  // =====================================================
  // CMRC CHANGE
  //
  // Kept for template compatibility.
  // CMRC is normally automatic.
  // =====================================================

  onCmrcChange(): void {

    this.selectedVoAlfId = null;

    this.selectedGroupId = null;

    this.selectedWomanId = null;

    this.voAlfList = [];

    this.groupList = [];

    this.womenList = [];


    this.closeForm();


    if (this.selectedCmrcId === null) {

      this.resetFundValues();

      this.applyLoanFilters();

      return;

    }


    this.loadVoAlfByCmrc();

  }


  // =====================================================
  // LOAD VO / ALF BY CURRENT CMRC
  // =====================================================

  loadVoAlfByCmrc(): void {

    this.selectedVoAlfId = null;

    this.selectedGroupId = null;

    this.selectedWomanId = null;

    this.groupList = [];

    this.womenList = [];


    if (this.selectedCmrcId === null) {

      this.voAlfList = [];

      this.resetFundValues();

      this.applyLoanFilters();

      return;

    }


    this.voAlfService
      .getByCmrcId(
        Number(this.selectedCmrcId)
      )
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];


          console.log(
            'VO / ALF FOR CURRENT CMRC:',
            this.voAlfList
          );


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

          this.applyLoanFilters();

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


    if (this.selectedVoAlfId === null) {

      this.resetFundValues();

      this.applyLoanFilters();

      return;

    }


    this.loadGroupsByVoAlf();

    this.loadWomenByVoAlf();

    this.calculateFundSummary();

    this.applyLoanFilters();

  }


  // =====================================================
  // LOAD GROUPS BY VO / ALF
  // =====================================================

  loadGroupsByVoAlf(): void {

    if (this.selectedVoAlfId === null) {

      this.groupList = [];

      return;

    }


    this.groupService
      .getByVoAlfId(
        Number(this.selectedVoAlfId)
      )
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];


          console.log(
            'GROUPS FOR VO / ALF:',
            this.selectedVoAlfId,
            this.groupList
          );


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
  //
  // Kept for template compatibility.
  // =====================================================

  loadAllGroups(): void {

    this.groupList = [];

    if (this.selectedVoAlfId !== null) {

      this.loadGroupsByVoAlf();

    }

  }


  // =====================================================
  // GROUP CHANGE
  // =====================================================

  loadWomenByGroup(): void {

    this.selectedWomanId = null;

    this.womenList = [];


    if (this.selectedGroupId === null) {

      if (this.selectedVoAlfId !== null) {

        this.loadWomenByVoAlf();

      } else {

        this.loadAllWomen();

      }

      this.applyLoanFilters();

      return;

    }


    this.womenService
      .getByGroupId(
        Number(this.selectedGroupId)
      )
      .subscribe({

        next: (data: Women[]) => {

          this.womenList = data || [];


          console.log(
            'WOMEN FOR GROUP:',
            this.selectedGroupId,
            this.womenList
          );


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

    if (this.selectedVoAlfId === null) {

      this.womenList = [];

      return;

    }


    this.womenService
      .getAll()
      .subscribe({

        next: (data: Women[]) => {

          const allWomen =
            data || [];


          this.womenList =
            allWomen.filter(
              (woman: any) =>
                Number(woman.voAlfId) ===
                Number(this.selectedVoAlfId)
            );


          console.log(
            'WOMEN FOR VO / ALF:',
            this.selectedVoAlfId,
            this.womenList
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

    this.womenService
      .getAll()
      .subscribe({

        next: (data: Women[]) => {

          this.womenList =
            data || [];

        },

        error: (error) => {

          console.error(
            'All women loading error:',
            error
          );

          this.womenList = [];

        }

      });

  }


  // =====================================================
  // LOAD LOANS
  // =====================================================

  loadLoans(): void {

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

    let result =
      [...this.loanList];


    // ===================================================
    // CMRC
    // ===================================================

    if (this.selectedCmrcId !== null) {

      result =
        result.filter(
          (loan: any) =>
            Number(loan.cmrcId) ===
            Number(this.selectedCmrcId)
        );

    }


    // ===================================================
    // VO / ALF
    // ===================================================

    if (this.selectedVoAlfId !== null) {

      result =
        result.filter(
          (loan: any) =>
            Number(loan.voAlfId) ===
            Number(this.selectedVoAlfId)
        );

    }


    // ===================================================
    // GROUP
    // ===================================================

    if (this.selectedGroupId !== null) {

      result =
        result.filter(
          (loan: any) =>
            Number(loan.groupId) ===
            Number(this.selectedGroupId)
        );

    }


    // ===================================================
    // WOMAN
    // ===================================================

    if (this.selectedWomanId !== null) {

      result =
        result.filter(
          (loan: any) =>
            Number(loan.womanId) ===
            Number(this.selectedWomanId)
        );

    }


    // ===================================================
    // SEARCH
    // ===================================================

    const search =
      String(
        this.globalSearch || ''
      )
        .trim()
        .toLowerCase();


    if (search) {

      result =
        result.filter(
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


    this.filteredLoanList =
      result;

  }


  // =====================================================
  // SEARCH CHANGE
  // =====================================================

  onSearchChange(): void {

    this.applyLoanFilters();

  }


  // =====================================================
  // FUND SUMMARY
  // =====================================================

  calculateFundSummary(): void {

    if (this.selectedVoAlfId === null) {

      this.resetFundValues();

      return;

    }


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


    this.totalAlfBalance =
      Number(
        selectedVoAlf.receivedFund ??
        selectedVoAlf.recievedFund ??
        selectedVoAlf.alfBalance ??
        selectedVoAlf.balanceAmount ??
        selectedVoAlf.totalAmount ??
        0
      );


    const voAlfLoans =
      this.loanList.filter(
        (loan: any) =>
          Number(loan.voAlfId) ===
          Number(this.selectedVoAlfId)
      );


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


    this.leftAlfBalance =
      this.totalAlfBalance -
      this.totalSanctionedAmount;


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

    if (
      this.selectedCmrcId === null ||
      this.selectedVoAlfId === null ||
      this.selectedGroupId === null
    ) {

      alert(
        'Please select CMRC, VO / ALF and Group first.'
      );

      return;

    }


    this.isEditMode = false;

    this.editingLoanId = null;

    this.newLoan =
      this.getEmptyLoan();


    this.clearSelectedImages();


    this.newLoan.cmrcId =
      this.selectedCmrcId;

    this.newLoan.voAlfId =
      this.selectedVoAlfId;

    this.newLoan.groupId =
      this.selectedGroupId;


    // Woman is optional
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

    this.newLoan =
      this.getEmptyLoan();

    this.clearSelectedImages();

  }


  // =====================================================
  // IMAGE SELECT
  // =====================================================

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


    const files =
      Array.from(input.files);


    for (const file of files) {

      if (
        !file.type.startsWith('image/')
      ) {

        alert(
          `${file.name} is not a valid image.`
        );

        input.value = '';

        return;

      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        alert(
          `${file.name} is larger than 5 MB.`
        );

        input.value = '';

        return;

      }

    }


    this.selectedImageFiles = [
      ...this.selectedImageFiles,
      ...files
    ];


    files.forEach(
      file => {

        this.imagePreviews.push(
          URL.createObjectURL(file)
        );

      }
    );


    input.value = '';

  }


  // =====================================================
  // REMOVE SELECTED IMAGE
  // =====================================================

  removeSelectedImage(
    index: number
  ): void {

    if (
      index < 0 ||
      index >=
      this.selectedImageFiles.length
    ) {

      return;

    }


    if (
      this.imagePreviews[index]
    ) {

      URL.revokeObjectURL(
        this.imagePreviews[index]
      );

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


  // =====================================================
  // CLEAR SELECTED IMAGES
  // =====================================================

  clearSelectedImages(): void {

    this.imagePreviews.forEach(
      url => {

        URL.revokeObjectURL(url);

      }
    );


    this.selectedImageFiles = [];

    this.imagePreviews = [];

  }


  // =====================================================
  // UPLOAD LOAN IMAGES
  // =====================================================

  uploadLoanImages(
    loanId: number
  ): any {

    if (
      !this.selectedImageFiles ||
      this.selectedImageFiles.length === 0
    ) {

      return null;

    }


    this.imageUploading = true;


    return this.loanService
      .uploadImages(
        loanId,
        this.selectedImageFiles
      );

  }


  // =====================================================
  // CALCULATE DISBURSED AMOUNT
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
        sanctioned -
        processingFee,
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


    // FLAT
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
        totalPayable /
        months;


      return;

    }


    // REDUCING
    if (
      this.newLoan.interestType ===
      'REDUCING'
    ) {

      const monthlyRate =
        rate / 12 / 100;


      if (monthlyRate === 0) {

        this.newLoan.monthlyEmi =
          principal /
          months;

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
      this.selectedCmrcId === null ||
      this.selectedVoAlfId === null ||
      this.selectedGroupId === null
    ) {

      alert(
        'Please select CMRC, VO / ALF and Group first.'
      );

      return;

    }


    this.loading = true;


    const payload: any = {

      ...this.newLoan,

      cmrcId:
        this.selectedCmrcId,

      voAlfId:
        this.selectedVoAlfId,

      groupId:
        this.selectedGroupId,

      // Woman optional
      womanId:
        this.newLoan.womanId || null

    };


    // ===================================================
    // UPDATE
    // ===================================================

    if (
      this.isEditMode &&
      this.editingLoanId
    ) {

      this.loanService
        .update(
          this.editingLoanId,
          payload
        )
        .subscribe({

          next: () => {

            this.loading = false;

            alert(
              'Loan updated successfully.'
            );


            this.closeForm();

            this.loadLoans();

          },

          error: (error) => {

            this.loading = false;

            console.error(
              'Loan update error:',
              error
            );


            alert(
              error?.error?.message ||
              'Failed to update loan.'
            );

          }

        });


      return;

    }


    // ===================================================
    // CREATE
    // ===================================================

    this.loanService
      .create(payload)
      .subscribe({

        next: (
          createdLoan: Loan
        ) => {

          console.log(
            'Loan created:',
            createdLoan
          );


          const loanId =
            Number(
              createdLoan?.id
            );


          if (!loanId) {

            this.loading = false;

            alert(
              'Loan created but loan ID was not returned by backend.'
            );

            return;

          }


          this.uploadImagesAfterLoanCreate(
            loanId
          );

        },

        error: (error) => {

          this.loading = false;

          console.error(
            'Loan creation error:',
            error
          );


          alert(
            error?.error?.message ||
            'Failed to create loan.'
          );

        }

      });

  }


  // =====================================================
  // AFTER LOAN CREATE
  // =====================================================

  private uploadImagesAfterLoanCreate(
    loanId: number
  ): void {

    if (
      !this.selectedImageFiles ||
      this.selectedImageFiles.length === 0
    ) {

      this.generateSchedulesAfterLoanCreate(
        loanId,
        false
      );

      return;

    }


    this.imageUploading = true;


    this.loanService
      .uploadImages(
        loanId,
        this.selectedImageFiles
      )
      .subscribe({

        next: (
          images: LoanImage[]
        ) => {

          console.log(
            'Loan images uploaded:',
            images
          );


          this.imageUploading = false;


          this.generateSchedulesAfterLoanCreate(
            loanId,
            true
          );

        },

        error: (error) => {

          console.error(
            'Loan image upload error:',
            error
          );


          this.imageUploading = false;


          alert(
            'Loan created successfully, but image upload failed.'
          );


          this.generateSchedulesAfterLoanCreate(
            loanId,
            false
          );

        }

      });

  }


  // =====================================================
  // GENERATE CL SCHEDULE + REPAYMENT
  // =====================================================

  private generateSchedulesAfterLoanCreate(
    loanId: number,
    imagesUploaded: boolean
  ): void {

    this.loanService
      .generateClSchedule(
        loanId
      )
      .subscribe({

        next: (
          clSchedule
        ) => {

          console.log(
            'CL Schedule generated:',
            clSchedule
          );


          this.loanService
            .generateRepayment(
              loanId
            )
            .subscribe({

              next: (
                repayment
              ) => {

                console.log(
                  'Repayment generated:',
                  repayment
                );


                this.loading = false;


                let message =
                  'Loan created successfully.\n' +
                  'CL Schedule generated successfully.\n' +
                  'Repayment schedule generated successfully.';


                if (imagesUploaded) {

                  message +=
                    '\nLoan images uploaded successfully.';

                }


                alert(message);


                this.closeForm();

                this.loadLoans();

              },

              error: (error) => {

                this.loading = false;


                console.error(
                  'Repayment generation error:',
                  error
                );


                alert(
                  'Loan created and CL Schedule generated, but Repayment generation failed.'
                );


                this.closeForm();

                this.loadLoans();

              }

            });

        },

        error: (error) => {

          this.loading = false;


          console.error(
            'CL Schedule generation error:',
            error
          );


          alert(
            'Loan created successfully, but CL Schedule generation failed.'
          );


          this.closeForm();

          this.loadLoans();

        }

      });

  }


  // =====================================================
  // EDIT LOAN
  // =====================================================

  editLoan(
    loan: Loan
  ): void {

    this.isEditMode = true;

    this.showForm = true;

    this.editingLoanId =
      loan.id || null;


    this.clearSelectedImages();


    this.loanImages = [];


    if (loan.id) {

      this.loadLoanImages(
        Number(loan.id)
      );

    }


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


    // Important:
    // When editing, synchronize hierarchy
    // from the existing loan.

    this.selectedCmrcId =
      loan.cmrcId != null
        ? Number(loan.cmrcId)
        : this.selectedCmrcId;


    this.selectedVoAlfId =
      loan.voAlfId != null
        ? Number(loan.voAlfId)
        : this.selectedVoAlfId;


    this.selectedGroupId =
      loan.groupId != null
        ? Number(loan.groupId)
        : this.selectedGroupId;


    this.selectedWomanId =
      loan.womanId != null
        ? Number(loan.womanId)
        : null;


    this.calculateEmi();

    this.scrollToLoanForm();

  }


  // =====================================================
  // DELETE LOAN
  // =====================================================

  deleteLoan(
    id: number
  ): void {

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

        next: (
          data: Loan[]
        ) => {

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
  // OPEN LOAN DETAILS
  // =====================================================

  openLoanDetails(
    loan: Loan
  ): void {

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


    this.loadLoanImages(
      Number(loan.id)
    );


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
  // LOAD LOAN IMAGES
  // =====================================================

  loadLoanImages(
    loanId: number
  ): void {

    this.loanImages = [];


    if (!loanId) {

      return;

    }


    this.loanService
      .getImagesByLoan(
        loanId
      )
      .subscribe({

        next: (
          images: LoanImage[]
        ) => {

          this.loanImages =
            images || [];


          this.cdRef.detectChanges();

        },

        error: (error) => {

          console.error(
            'Loan images loading error:',
            error
          );

          this.loanImages = [];

        }

      });

  }


  // =====================================================
  // IMAGE VIEW URL
  // =====================================================

  getLoanImageViewUrl(
    imageId?: number
  ): string {

    if (!imageId) {

      return '';

    }


    return this.loanService
      .getImageViewUrl(
        imageId
      );

  }


  // =====================================================
  // IMAGE DOWNLOAD URL
  // =====================================================

  getLoanImageDownloadUrl(
    imageId?: number
  ): string {

    if (!imageId) {

      return '';

    }


    return this.loanService
      .getImageDownloadUrl(
        imageId
      );

  }


  // =====================================================
  // DELETE LOAN IMAGE
  // =====================================================

  deleteLoanImage(
    image: LoanImage
  ): void {

    if (!image.id) {

      return;

    }


    const confirmed =
      confirm(
        `Are you sure you want to delete "${image.fileName || 'this image'}"?`
      );


    if (!confirmed) {

      return;

    }


    this.loanService
      .deleteImage(
        image.id
      )
      .subscribe({

        next: () => {

          alert(
            'Loan image deleted successfully.'
          );


          if (
            this.selectedLoan?.id
          ) {

            this.loadLoanImages(
              Number(
                this.selectedLoan.id
              )
            );

          }

        },

        error: (error) => {

          console.error(
            'Loan image delete error:',
            error
          );


          alert(
            error?.error?.message ||
            'Failed to delete loan image.'
          );

        }

      });

  }


  // =====================================================
  // CLOSE DETAILS
  // =====================================================

  closeLoanDetails(): void {

    this.selectedLoan = null;

  }


  // =====================================================
  // CMRC NAME
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
  // VO / ALF NAME
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
  // GROUP NAME
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


    const groups =
      this.groupList.filter(
        group =>
          Number(group.voAlfId) ===
          Number(this.selectedVoAlfId)
      );


    if (!groups.length) {

      return '';

    }


    const village =
      groups.find(
        group =>
          group.villageName &&
          group.villageName.trim() !== ''
      );


    return village?.villageName || '';

  }


  // =====================================================
  // TOTAL LOAN AMOUNT
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
      (
        n: number
      ): string => {

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


    return (
      result.trim() +
      ' Rupees Only'
    );

  }


  // =====================================================
  // EXPORT
  // =====================================================

  exportToExcel(): void {

    console.log(
      'Export requested:',
      this.filteredLoanList
    );

  }

}