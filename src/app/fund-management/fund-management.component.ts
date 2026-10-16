import { Component, OnInit } from '@angular/core';
import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';

import {
  FundManagementService,
  FundAccount,
  FundTransaction,
  FundTransactionRequest
} from '../services/fund-management.service';

type TransactionType = 'RECEIPT' | 'PAYMENT';

type FundCategory = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-fund-management',
  templateUrl: './fund-management.component.html',
  styleUrls: ['./fund-management.component.css']
})
export class FundManagementComponent implements OnInit {

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;

  account: FundAccount = {};
  transactions: FundTransaction[] = [];

  activeTab: 'OVERVIEW' | 'RECEIPT' | 'PAYMENT' = 'OVERVIEW';

  isLoading = false;
  isSaving = false;

  filterType = 'ALL';
  filterStatus = 'ALL';
  searchText = '';

  transactionForm: {
    transactionType: TransactionType;
    category: string;
    amount: number | null;
    transactionDate: string;
    remark: string;
  } = {
    transactionType: 'RECEIPT',
    category: 'OTHER_INCOME',
    amount: null,
    transactionDate: this.getToday(),
    remark: ''
  };

  readonly receiptCategories: FundCategory[] = [
    { value: 'FUND_RECEIVED', label: 'Fund Received from CMRC' },
    { value: 'LOAN_REPAYMENT', label: 'Loan Repayment Received' },
    { value: 'INTEREST_RECEIVED', label: 'Interest Received' },
    { value: 'PENALTY_RECEIVED', label: 'Penalty Received' },
    { value: 'OTHER_INCOME', label: 'Other Receipt / Income' }
  ];

  readonly paymentCategories: FundCategory[] = [
    { value: 'LOAN_DISBURSEMENT', label: 'Loan Disbursement' },
    { value: 'BANK_CHARGES', label: 'Bank Charges' },
    { value: 'SMS_CHARGES', label: 'SMS Charges' },
    { value: 'RECORD_FEES', label: 'Record Fees' },
    { value: 'ACCOUNTANT_EXPENSE', label: 'Accountant Expense' },
    { value: 'KIT_EXPENSE', label: 'Kit Expense' },
    { value: 'OTHER_EXPENSE', label: 'Other Expense' },
    { value: 'TRANSFER_TO_CMRC', label: 'Transfer to CMRC' }
  ];

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private fundService: FundManagementService
  ) {}

  ngOnInit(): void {
    this.loadCmrc();
  }

  private getToday(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadCmrc(): void {
    this.isLoading = true;

    this.cmrcService.getAll().subscribe({
      next: data => {
        this.cmrcList = data || [];

        let userCmrcId: number | null = null;

        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const id = Number(user.cmrcId);

          if (id > 0) {
            userCmrcId = id;
          }
        } catch {
          userCmrcId = null;
        }

        const selected = this.cmrcList.find(
          item => Number(item.id) === userCmrcId
        ) || this.cmrcList[0];

        this.selectedCmrcId = selected?.id ?? null;
        this.isLoading = false;

        if (this.selectedCmrcId !== null) {
          this.loadVoAlf();
        } else {
          this.voAlfList = [];
          this.selectedVoAlfId = null;
          this.account = {};
          this.transactions = [];
        }
      },
      error: error => {
        console.error('Unable to load CMRC:', error);
        this.isLoading = false;
        alert('Unable to load CMRC data.');
      }
    });
  }

  onCmrcChange(): void {
    this.selectedVoAlfId = null;
    this.voAlfList = [];
    this.transactions = [];
    this.account = {};

    if (this.selectedCmrcId !== null) {
      this.loadVoAlf();
    }
  }

  loadVoAlf(): void {
    if (this.selectedCmrcId === null) {
      return;
    }

    this.isLoading = true;

    this.voAlfService.getByCmrcId(this.selectedCmrcId).subscribe({
      next: data => {
        this.voAlfList = data || [];
        this.isLoading = false;

        if (this.voAlfList.length) {
          this.selectedVoAlfId = this.voAlfList[0].id ?? null;

          if (this.selectedVoAlfId !== null) {
            this.loadFundData();
          }
        } else {
          this.selectedVoAlfId = null;
          this.account = {};
          this.transactions = [];
        }
      },
      error: error => {
        console.error('Unable to load VO / ALF:', error);
        this.isLoading = false;
        alert('Unable to load VO / ALF data.');
      }
    });
  }

  onVoAlfChange(): void {
    this.account = {};
    this.transactions = [];

    if (this.selectedVoAlfId !== null) {
      this.loadFundData();
    }
  }

  loadFundData(): void {
    if (this.selectedVoAlfId === null) {
      return;
    }

    this.isLoading = true;

    let completed = 0;

    const finish = (): void => {
      completed++;

      if (completed === 2) {
        this.isLoading = false;
      }
    };

    this.fundService.getAccount(this.selectedVoAlfId).subscribe({
      next: data => {
        this.account = data || {};
        finish();
      },
      error: error => {
        console.error('Unable to load fund account:', error);
        this.account = {};
        finish();
      }
    });

    this.fundService.getTransactions(this.selectedVoAlfId).subscribe({
      next: data => {
        this.transactions = (data || []).slice().sort((a, b) =>
          String(b.transactionDate || '').localeCompare(
            String(a.transactionDate || '')
          )
        );

        finish();
      },
      error: error => {
        console.error('Unable to load transactions:', error);
        this.transactions = [];
        finish();
      }
    });
  }

  openOverview(): void {
    this.activeTab = 'OVERVIEW';
  }

  openReceipt(): void {
    this.resetForm('RECEIPT');
    this.activeTab = 'RECEIPT';
  }

  openPayment(): void {
    this.resetForm('PAYMENT');
    this.activeTab = 'PAYMENT';
  }

  private resetForm(type: TransactionType): void {
    this.transactionForm = {
      transactionType: type,
      category: type === 'RECEIPT' ? 'OTHER_INCOME' : 'OTHER_EXPENSE',
      amount: null,
      transactionDate: this.getToday(),
      remark: ''
    };
  }

  onTransactionTypeChange(type: TransactionType): void {
    this.transactionForm.transactionType = type;
    this.transactionForm.category =
      type === 'RECEIPT' ? 'OTHER_INCOME' : 'OTHER_EXPENSE';
  }

  get currentCategories(): FundCategory[] {
    return this.transactionForm.transactionType === 'RECEIPT'
      ? this.receiptCategories
      : this.paymentCategories;
  }

  get totalBalance(): number {
    return Number(this.account.balance ?? 0);
  }

  get selectedVoAlf(): VoAlf | undefined {
    return this.voAlfList.find(
      item => Number(item.id) === Number(this.selectedVoAlfId)
    );
  }

  get selectedCmrc(): Cmrc | undefined {
    return this.cmrcList.find(
      item => Number(item.id) === Number(this.selectedCmrcId)
    );
  }

  get isTransferToCmrc(): boolean {
    return this.transactionForm.category === 'TRANSFER_TO_CMRC';
  }

  saveTransaction(): void {
    if (this.selectedVoAlfId === null) {
      alert('Please select a VO / ALF.');
      return;
    }

    const amount = Number(this.transactionForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter an amount greater than zero.');
      return;
    }

    if (!this.transactionForm.category || !this.transactionForm.transactionDate) {
      alert('Please complete all required fields.');
      return;
    }

    if (
      this.transactionForm.category === 'TRANSFER_TO_CMRC' &&
      amount > this.totalBalance
    ) {
      alert('Transfer amount cannot exceed the available VO / ALF balance.');
      return;
    }

    const request: FundTransactionRequest = {
      voAlfId: this.selectedVoAlfId,
      transactionType: this.transactionForm.transactionType,
      category: this.transactionForm.category,
      amount,
      transactionDate: this.transactionForm.transactionDate,
      remark: this.transactionForm.remark.trim()
    };

    this.isSaving = true;

    this.fundService.submitTransaction(request).subscribe({
      next: transaction => {
        this.isSaving = false;

        if (transaction?.approvalStatus === 'PENDING') {
          alert('Transaction submitted for approval. Balances will update after approval.');
        } else {
          alert('Transaction submitted successfully.');
        }

        this.openOverview();
        this.loadFundData();
      },
      error: error => {
        console.error('Unable to submit transaction:', error);
        this.isSaving = false;

        alert(
          error?.error?.message ||
          error?.error?.error ||
          'Unable to submit transaction.'
        );
      }
    });
  }

  get filteredTransactions(): FundTransaction[] {
    const search = this.searchText.trim().toLowerCase();

    return this.transactions.filter(transaction => {
      const matchesType =
        this.filterType === 'ALL' ||
        transaction.transactionType === this.filterType;

      const matchesStatus =
        this.filterStatus === 'ALL' ||
        transaction.approvalStatus === this.filterStatus;

      const text = [
        transaction.id,
        transaction.category,
        transaction.remark,
        transaction.referenceType,
        transaction.referenceId
      ].join(' ').toLowerCase();

      return matchesType &&
        matchesStatus &&
        (!search || text.includes(search));
    });
  }

  getCategoryLabel(category: string): string {
    const all = [...this.receiptCategories, ...this.paymentCategories];
    const found = all.find(item => item.value === category);

    return found?.label || category;
  }

  getStatusClass(status?: string): string {
    switch (String(status || '').toUpperCase()) {
      case 'APPROVED':
        return 'status-approved';
      case 'PENDING':
        return 'status-pending';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-unknown';
    }
  }
}