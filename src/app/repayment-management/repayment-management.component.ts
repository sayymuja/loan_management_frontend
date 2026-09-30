import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import * as XLSX from 'xlsx';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { GroupService, Group } from '../services/group.service';
import { WomenService, Women } from '../services/women.service';
import { LoanService, Loan } from '../services/loan.service';

import {
  RepaymentService,
  Repayment
} from '../services/repayment.service';


@Component({
  selector: 'app-repayment-management',
  templateUrl: './repayment-management.component.html',
  styleUrls: ['./repayment-management.component.css']
})
export class RepaymentManagementComponent
  implements OnInit, OnChanges {


  // =====================================================
  // LISTS
  // =====================================================

  cmrcList: Cmrc[] = [];

  voAlfList: VoAlf[] = [];

  groupList: Group[] = [];

  womenList: Women[] = [];

  loanList: Loan[] = [];

  repaymentList: Repayment[] = [];


  // =====================================================
  // SELECTED IDS
  // =====================================================

  selectedCmrcId: number | null = null;

  selectedVoAlfId: number | null = null;

  selectedGroupId: number | null = null;

  selectedWomanId: number | null = null;

  selectedLoanId: number | null = null;


  // =====================================================
  // LOAN INPUT
  // =====================================================

  @Input() loanId: number | null = null;

  @Input() loan: Loan | null = null;

  selectedLoan: Loan | null = null;


  // =====================================================
  // PAYMENT
  // =====================================================

  regularRepayment: boolean = true;

  showPaymentModal = false;

  selectedRepayment: Repayment | null = null;

  paymentAmount = 0;

  penaltyAmount = 0;


  // =====================================================
  // LOADING
  // =====================================================

  loading = false;


  // =====================================================
  // COMPONENT INITIALIZED
  // =====================================================

  private componentInitialized = false;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService,
    private loanService: LoanService,
    private repaymentService: RepaymentService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.componentInitialized = true;

    this.loadCmrc();

    this.initializeInputLoan();
  }


  // =====================================================
  // INPUT CHANGE
  // =====================================================

  ngOnChanges(changes: SimpleChanges): void {

    if (!this.componentInitialized) {
      return;
    }

    if (
      changes['loanId'] ||
      changes['loan']
    ) {
      this.initializeInputLoan();
    }
  }


  // =====================================================
  // INITIALIZE INPUT LOAN
  // =====================================================

  private initializeInputLoan(): void {

    if (this.loanId === null) {
      return;
    }

    this.selectedLoanId = this.loanId;

    if (
      this.loan &&
      this.loan.id === this.loanId
    ) {

      this.selectedLoan = this.loan;

      this.loadOrGenerateSchedule();

    }
    else {

      this.loadLoanById(this.loanId);

    }
  }


  // =====================================================
  // LOAD CMRC
  // =====================================================

  loadCmrc(): void {

    this.cmrcService
      .getAll()
      .subscribe({

        next: (data: Cmrc[]) => {

          this.cmrcList = data || [];

        },

        error: (error: any) => {

          console.error(
            'CMRC API Error:',
            error
          );

          this.cmrcList = [];

        }

      });
  }


  // =====================================================
  // LOAD VO / ALF BY CMRC
  // =====================================================

  loadVoAlfByCmrc(): void {

    this.voAlfList = [];

    this.groupList = [];

    this.womenList = [];

    this.loanList = [];

    this.repaymentList = [];


    this.selectedVoAlfId = null;

    this.selectedGroupId = null;

    this.selectedWomanId = null;

    this.selectedLoanId = null;

    this.selectedLoan = null;


    if (this.selectedCmrcId === null) {
      return;
    }


    this.loading = true;


    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          this.loading = false;

        },

        error: (error: any) => {

          console.error(
            'VO/ALF API Error:',
            error
          );

          this.voAlfList = [];

          this.loading = false;

        }

      });
  }


  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    this.groupList = [];

    this.womenList = [];

    this.loanList = [];

    this.repaymentList = [];


    this.selectedGroupId = null;

    this.selectedWomanId = null;

    this.selectedLoanId = null;

    this.selectedLoan = null;


    if (this.selectedVoAlfId === null) {
      return;
    }


    this.loadGroupsByVoAlf();
  }


  // =====================================================
  // LOAD GROUPS BY VO / ALF
  // =====================================================

  loadGroupsByVoAlf(): void {

    this.groupList = [];

    this.womenList = [];

    this.loanList = [];

    this.repaymentList = [];


    this.selectedGroupId = null;

    this.selectedWomanId = null;

    this.selectedLoanId = null;

    this.selectedLoan = null;


    if (this.selectedVoAlfId === null) {
      return;
    }


    this.loading = true;


    this.groupService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

          this.loading = false;

        },

        error: (error: any) => {

          console.error(
            'Group API Error:',
            error
          );

          this.groupList = [];

          this.loading = false;

        }

      });
  }


  // =====================================================
  // LOAD WOMEN BY GROUP
  // =====================================================

  loadWomenByGroup(): void {

    this.womenList = [];

    this.loanList = [];

    this.repaymentList = [];


    this.selectedWomanId = null;

    this.selectedLoanId = null;

    this.selectedLoan = null;


    if (this.selectedGroupId === null) {
      return;
    }


    this.loading = true;


    this.womenService
      .getByGroupId(this.selectedGroupId)
      .subscribe({

        next: (data: Women[]) => {

          this.womenList = data || [];

          this.loading = false;

        },

        error: (error: any) => {

          console.error(
            'Women API Error:',
            error
          );

          this.womenList = [];

          this.loading = false;

        }

      });
  }


  // =====================================================
  // LOAD LOANS BY WOMAN
  // =====================================================

  loadLoansByWoman(): void {

    this.loanList = [];

    this.repaymentList = [];


    this.selectedLoanId = null;

    this.selectedLoan = null;


    if (this.selectedWomanId === null) {
      return;
    }


    this.loading = true;


    this.loanService
      .getByWomanId(this.selectedWomanId)
      .subscribe({

        next: (data: Loan[]) => {

          this.loanList = data || [];

          this.loading = false;

        },

        error: (error: any) => {

          console.error(
            'Loan API Error:',
            error
          );

          this.loanList = [];

          this.loading = false;

        }

      });
  }


  // =====================================================
  // LOAD LOAN BY ID
  // =====================================================

  loadLoanById(id: number): void {

    this.loading = true;


    this.loanService
      .getById(id)
      .subscribe({

        next: (data: Loan) => {

          this.selectedLoan = data;

          this.loan = data;

          this.selectedLoanId =
            data.id || id;

          this.loading = false;

          this.loadOrGenerateSchedule();

        },

        error: (error: any) => {

          console.error(
            'Loan API Error:',
            error
          );

          this.loading = false;

        }

      });
  }


  // =====================================================
  // LOAN CHANGE
  // =====================================================

  onLoanChange(): void {

    this.repaymentList = [];

    this.selectedLoan = null;


    if (this.selectedLoanId === null) {
      return;
    }


    const loan =
      this.loanList.find(
        item =>
          item.id === this.selectedLoanId
      );


    if (!loan) {

      console.error(
        'Selected loan not found:',
        this.selectedLoanId
      );

      return;

    }


    this.selectedLoan = loan;

    this.loan = loan;


    this.loadOrGenerateSchedule();
  }


  // =====================================================
  // LOAD EXISTING REPAYMENT SCHEDULE
  // =====================================================

  loadOrGenerateSchedule(): void {

    if (this.selectedLoanId === null) {
      return;
    }


    this.loading = true;


    this.repaymentService
      .generateSchedule(this.selectedLoanId)
      .subscribe({

        next: (data: Repayment[]) => {

          if (
            data &&
            data.length > 0
          ) {

            this.repaymentList = data;

            this.loading = false;

          }
          else {

            this.generateSchedule();

          }

        },

        error: (error: any) => {

          console.error(
            'Repayment API Error:',
            error
          );

          this.loading = false;

        }

      });
  }


  // =====================================================
  // GENERATE REPAYMENT SCHEDULE
  // =====================================================

  generateSchedule(): void {

    if (this.selectedLoanId === null) {
      return;
    }


    this.loading = true;


    this.repaymentService
      .generateSchedule(
        this.selectedLoanId
      )
      .subscribe({

        next: (data: Repayment[]) => {

          this.repaymentList =
            data || [];

          this.loading = false;

        },

        error: (error: any) => {

          console.error(
            'Generate Schedule Error:',
            error
          );

          this.loading = false;

          alert(
            'Failed to generate repayment schedule'
          );

        }

      });
  }


  // =====================================================
  // OPEN PAYMENT MODAL
  // =====================================================

  payEmi(
    repayment: Repayment
  ): void {

    if (!repayment.id) {
      return;
    }


    this.selectedRepayment =
      repayment;


    const scheduledAmount =
      Number(
        repayment.scheduledAmount || 0
      );


    const alreadyPaid =
      Number(
        repayment.paidAmount || 0
      );


    let remainingAmount =
      scheduledAmount -
      alreadyPaid;


    if (remainingAmount < 0) {
      remainingAmount = 0;
    }


    if (
      repayment.paymentStatus === 'PARTIAL'
    ) {

      this.paymentAmount =
        remainingAmount;

    }
    else {

      this.paymentAmount =
        scheduledAmount;

    }


    this.penaltyAmount =
      Number(
        repayment.penaltyAmount || 0
      );


    this.regularRepayment = true;

    this.showPaymentModal = true;
  }


  // =====================================================
  // EDIT PAID EMI
  // =====================================================

  editPaidEmi(
    repayment: Repayment
  ): void {

    if (!repayment.id) {
      return;
    }


    this.selectedRepayment =
      repayment;


    this.paymentAmount =
      Number(
        repayment.paidAmount || 0
      );


    this.penaltyAmount =
      Number(
        repayment.penaltyAmount || 0
      );


    this.showPaymentModal = true;
  }


  // =====================================================
  // CONFIRM PAYMENT
  // =====================================================

  confirmPayment(): void {

    if (!this.selectedRepayment?.id) {

      console.error(
        'Repayment ID missing'
      );

      return;

    }


    const paidAmount =
      Number(
        this.paymentAmount
      );


    const penaltyAmount =
      Number(
        this.penaltyAmount
      );


    if (
      isNaN(paidAmount) ||
      paidAmount < 0
    ) {

      alert(
        'Please enter a valid paid amount'
      );

      return;

    }


    if (
      isNaN(penaltyAmount) ||
      penaltyAmount < 0
    ) {

      alert(
        'Please enter a valid penalty amount'
      );

      return;

    }


    const repaymentId =
      this.selectedRepayment.id;


    // =================================================
    // EDIT EXISTING PAID PAYMENT
    // =================================================

    if (
      this.selectedRepayment.paymentStatus === 'PAID'
    ) {

      this.repaymentService
        .editPaidEmi(
          repaymentId,
          paidAmount,
          penaltyAmount
        )
        .subscribe({

          next: (
            updated: Repayment
          ) => {

            this.updateRepaymentInList(
              updated
            );

            this.closePaymentModal();

          },

          error: (error: any) => {

            console.error(
              'Edit Paid EMI Error:',
              error
            );

            alert(
              'Failed to update payment'
            );

          }

        });

      return;
    }


    // =================================================
    // PAY PENDING / PARTIAL EMI
    // =================================================

    this.repaymentService
      .payEmi(
        repaymentId,
        paidAmount,
        penaltyAmount,
        this.regularRepayment
      )
      .subscribe({

        next: (
          updated: Repayment
        ) => {

          this.updateRepaymentInList(
            updated
          );

          this.closePaymentModal();

        },

        error: (error: any) => {

          console.error(
            'Pay EMI Error:',
            error
          );

          alert(
            'Failed to pay EMI'
          );

        }

      });
  }


  // =====================================================
  // UPDATE REPAYMENT ROW
  // =====================================================

  private updateRepaymentInList(
    updated: Repayment
  ): void {

    const index =
      this.repaymentList.findIndex(
        repayment =>
          repayment.id === updated.id
      );


    if (index !== -1) {

      this.repaymentList[index] =
        updated;

    }
  }


  // =====================================================
  // CLOSE PAYMENT MODAL
  // =====================================================

  closePaymentModal(): void {

    this.showPaymentModal = false;

    this.selectedRepayment = null;

    this.paymentAmount = 0;

    this.penaltyAmount = 0;
  }


  // =====================================================
  // SELECTED CMRC NAME
  // =====================================================

  getSelectedCmrcName(): string {

    const cmrc =
      this.cmrcList.find(
        c =>
          c.id === this.selectedCmrcId
      );


    return cmrc?.cmrcName || '';
  }


  // =====================================================
  // SELECTED VO / ALF NAME
  // =====================================================

  getSelectedVoAlfName(): string {

    const voAlf =
      this.voAlfList.find(
        v =>
          v.id === this.selectedVoAlfId
      );


    return voAlf?.voAlfName || '';
  }


  // =====================================================
  // SELECTED VILLAGE NAME
  // =====================================================
  // Village is now stored directly in VO / ALF.
  // =====================================================

  getSelectedVillageName(): string {

    const voAlf =
      this.voAlfList.find(
        v =>
          v.id === this.selectedVoAlfId
      );


    return voAlf?.villageName || '';
  }


  // =====================================================
  // SELECTED VO / ALF
  // =====================================================

  getSelectedVoAlf(): VoAlf | undefined {

    return this.voAlfList.find(
      voAlf =>
        voAlf.id === this.selectedVoAlfId
    );
  }


  // =====================================================
  // SELECTED GROUP NAME
  // =====================================================

  getSelectedGroupName(): string {

    const group =
      this.groupList.find(
        g =>
          g.id === this.selectedGroupId
      );


    return group?.groupName || '';
  }


  // =====================================================
  // SELECTED WOMAN NAME
  // =====================================================

  getSelectedWomanName(): string {

    const woman =
      this.womenList.find(
        w =>
          w.id === this.selectedWomanId
      );


    return woman?.womanName || '';
  }


  // =====================================================
  // SELECTED LOAN
  // =====================================================

  getSelectedLoan(): Loan | undefined {

    return this.loanList.find(
      loan =>
        loan.id === this.selectedLoanId
    );
  }


  // =====================================================
  // TOTAL INSTALLMENTS
  // =====================================================

  getTotalInstallments(): number {

    if (
      this.selectedLoan &&
      this.selectedLoan.repaymentPeriodMonths !== undefined &&
      this.selectedLoan.repaymentPeriodMonths !== null
    ) {

      return Number(
        this.selectedLoan.repaymentPeriodMonths
      );
    }


    return this.repaymentList.length;
  }


  // =====================================================
  // PAID COUNT
  // =====================================================

  getPaidCount(): number {

    return this.repaymentList.filter(
      repayment =>
        repayment.paymentStatus === 'PAID'
    ).length;
  }


  // =====================================================
  // PARTIAL COUNT
  // =====================================================

  getPartialCount(): number {

    return this.repaymentList.filter(
      repayment =>
        repayment.paymentStatus === 'PARTIAL'
    ).length;
  }


  // =====================================================
  // PENDING COUNT
  // =====================================================

  getPendingCount(): number {

    return this.repaymentList.filter(
      repayment =>
        !repayment.paymentStatus ||
        repayment.paymentStatus === 'PENDING'
    ).length;
  }


  // =====================================================
  // TOTAL SCHEDULED EMI
  // =====================================================

  getTotalScheduledEmi(): number {

    return this.repaymentList.reduce(
      (
        total: number,
        repayment: Repayment
      ) => {

        return (
          total +
          Number(
            repayment.scheduledAmount || 0
          )
        );

      },
      0
    );
  }


  // =====================================================
  // TOTAL PAID AMOUNT
  // =====================================================

  getTotalPaidAmount(): number {

    return this.repaymentList.reduce(
      (
        total: number,
        repayment: Repayment
      ) => {

        return (
          total +
          Number(
            repayment.paidAmount || 0
          )
        );

      },
      0
    );
  }


  // =====================================================
  // TOTAL PRINCIPAL PAID
  // =====================================================

  getTotalPrincipal(): number {

    return this.repaymentList
      .filter(
        repayment =>
          repayment.paymentStatus === 'PAID' ||
          repayment.paymentStatus === 'PARTIAL'
      )
      .reduce(
        (
          total: number,
          repayment: Repayment
        ) => {

          return (
            total +
            Number(
              repayment.principalAmount || 0
            )
          );

        },
        0
      );
  }


  // =====================================================
  // TOTAL INTEREST PAID
  // =====================================================

  getTotalInterest(): number {

    return this.repaymentList
      .filter(
        repayment =>
          repayment.paymentStatus === 'PAID' ||
          repayment.paymentStatus === 'PARTIAL'
      )
      .reduce(
        (
          total: number,
          repayment: Repayment
        ) => {

          return (
            total +
            Number(
              repayment.interestAmount || 0
            )
          );

        },
        0
      );
  }


  // =====================================================
  // TOTAL PENALTY
  // =====================================================

  getTotalPenalty(): number {

    return this.repaymentList.reduce(
      (
        total: number,
        repayment: Repayment
      ) => {

        return (
          total +
          Number(
            repayment.penaltyAmount || 0
          )
        );

      },
      0
    );
  }


  // =====================================================
  // TOTAL AMOUNT
  // =====================================================

  getTotalAmount(): number {

    return this.repaymentList.reduce(
      (
        total: number,
        repayment: Repayment
      ) => {

        return (
          total +
          Number(
            repayment.totalAmount || 0
          )
        );

      },
      0
    );
  }


  // =====================================================
  // OUTSTANDING PRINCIPAL
  // =====================================================

  getOutstandingPrincipal(): number {

    if (!this.selectedLoan) {
      return 0;
    }


    const loanAmount =
      Number(
        this.selectedLoan.loanAmount || 0
      );


    const principalPaid =
      this.getTotalPrincipal();


    return Math.max(
      loanAmount -
      principalPaid,
      0
    );
  }


  // =====================================================
  // OUTSTANDING AMOUNT
  // =====================================================

  getOutstandingAmount(
    repayment: Repayment
  ): number {

    if (!this.selectedLoan) {
      return 0;
    }


    const loanAmount =
      Number(
        this.selectedLoan.loanAmount || 0
      );


    const installmentNo =
      Number(
        repayment.installmentNo || 0
      );


    let principalPaid = 0;


    this.repaymentList
      .filter(
        item =>
          Number(
            item.installmentNo || 0
          ) <= installmentNo
      )
      .filter(
        item =>
          item.paymentStatus === 'PAID' ||
          item.paymentStatus === 'PARTIAL'
      )
      .forEach(
        item => {

          principalPaid +=
            Number(
              item.principalAmount || 0
            );

        }
      );


    return Math.max(
      loanAmount -
      principalPaid,
      0
    );
  }


  // =====================================================
  // NEXT PENDING EMI
  // =====================================================

  getNextPendingEmi(): Repayment | null {

    const pendingList =
      this.repaymentList
        .filter(
          repayment =>
            repayment.paymentStatus !== 'PAID'
        )
        .slice()
        .sort(
          (
            a: Repayment,
            b: Repayment
          ) => {

            const dateA =
              a.installmentDate
                ? new Date(
                    a.installmentDate
                  ).getTime()
                : 0;


            const dateB =
              b.installmentDate
                ? new Date(
                    b.installmentDate
                  ).getTime()
                : 0;


            return dateA - dateB;

          }
        );


    return pendingList.length > 0
      ? pendingList[0]
      : null;
  }


  // =====================================================
  // NEXT EMI DATE
  // =====================================================

  getNextEmiDate(): string {

    const nextEmi =
      this.getNextPendingEmi();


    return nextEmi?.installmentDate || '';
  }


  // =====================================================
  // LOAN STATUS
  // =====================================================

  getLoanStatus(): string {

    if (!this.selectedLoan) {
      return '-';
    }


    const totalInstallments =
      this.getTotalInstallments();


    const paidInstallments =
      this.getPaidCount();


    if (
      totalInstallments > 0 &&
      paidInstallments >= totalInstallments
    ) {

      return 'CLOSED';
    }


    return 'ACTIVE';
  }


  // =====================================================
  // EXCEL EXPORT
  // =====================================================

  exportToExcel(): void {

    if (
      !this.repaymentList ||
      this.repaymentList.length === 0
    ) {

      alert(
        'No repayment records available for export'
      );

      return;
    }


    const excelData =
      this.repaymentList.map(
        (
          repayment: Repayment,
          index: number
        ) => ({

          'Sr. No.':
            index + 1,

          'Installment No.':
            repayment.installmentNo || '',

          'Installment Date':
            repayment.installmentDate || '',

          'Scheduled EMI':
            Number(
              repayment.scheduledAmount || 0
            ),

          'Paid Amount':
            Number(
              repayment.paidAmount || 0
            ),

          'Principal':
            Number(
              repayment.principalAmount || 0
            ),

          'Interest':
            Number(
              repayment.interestAmount || 0
            ),

          'Penalty Amount':
            Number(
              repayment.penaltyAmount || 0
            ),

          'Total Amount':
            Number(
              repayment.totalAmount || 0
            ),

          'Status':
            repayment.paymentStatus === 'PAID'
              ? 'Paid'
              : repayment.paymentStatus === 'PARTIAL'
                ? 'Partial'
                : 'Pending'

        })
      );


    const totalScheduledEmi =
      this.getTotalScheduledEmi();

    const totalPaidAmount =
      this.getTotalPaidAmount();

    const totalPrincipal =
      this.getTotalPrincipal();

    const totalInterest =
      this.getTotalInterest();

    const totalPenalty =
      this.getTotalPenalty();

    const totalAmount =
      this.getTotalAmount();

    const paidInstallments =
      this.getPaidCount();

    const partialInstallments =
      this.getPartialCount();

    const pendingInstallments =
      this.getPendingCount();


    const worksheet: XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(
        excelData
      );


    XLSX.utils.sheet_add_aoa(
      worksheet,
      [

        [],

        ['REPAYMENT SUMMARY'],

        [
          'Loan ID',
          this.selectedLoanId || ''
        ],

        [
          'CMRC',
          this.getSelectedCmrcName()
        ],

        [
          'VO / ALF',
          this.getSelectedVoAlfName()
        ],

        [
          'Village',
          this.getSelectedVillageName()
        ],

        [
          'Group Name',
          this.selectedLoan?.groupName ||
          this.getSelectedGroupName()
        ],

        [
          'Woman Name',
          this.selectedLoan?.womanName ||
          this.getSelectedWomanName()
        ],

        [
          'Loan Amount',
          Number(
            this.selectedLoan?.loanAmount || 0
          )
        ],

        [
          'Monthly EMI',
          Number(
            this.selectedLoan?.monthlyEmi || 0
          )
        ],

        [
          'Interest Rate',
          Number(
            this.selectedLoan?.interestRate || 0
          )
        ],

        [
          'Total Installments',
          this.getTotalInstallments()
        ],

        [
          'Paid Installments',
          paidInstallments
        ],

        [
          'Partial Installments',
          partialInstallments
        ],

        [
          'Pending Installments',
          pendingInstallments
        ],

        [
          'Total Scheduled EMI',
          totalScheduledEmi
        ],

        [
          'Total Paid Amount',
          totalPaidAmount
        ],

        [
          'Total Principal Paid',
          totalPrincipal
        ],

        [
          'Total Interest Paid',
          totalInterest
        ],

        [
          'Total Penalty',
          totalPenalty
        ],

        [
          'Total Amount',
          totalAmount
        ],

        [
          'Outstanding Principal',
          this.getOutstandingPrincipal()
        ]

      ],
      {
        origin:
          `A${excelData.length + 3}`
      }
    );


    const workbook: XLSX.WorkBook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Repayment Schedule'
    );


    worksheet['!cols'] = [

      { wch: 10 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 }

    ];


    const fileName =
      `Loan_${this.selectedLoanId}_Repayment_Schedule.xlsx`;


    XLSX.writeFile(
      workbook,
      fileName
    );
  }

}