import { Component, OnInit } from '@angular/core';
import { Cmrc, CmrcService } from '../services/cmrc.service';

@Component({
  selector: 'app-cmrc',
  templateUrl: './cmrc.component.html',
  styleUrls: ['./cmrc.component.css']
})
export class CmrcComponent implements OnInit {

  // =====================================================
  // CMRC DATA
  // =====================================================

  cmrcList: Cmrc[] = [];

  // =====================================================
  // PAGE STATE
  // =====================================================

  isLoading = false;
  isSaving = false;
  showForm = false;
  isEditMode = false;
  isAdmin = false;

  errorMessage = '';
  successMessage = '';

  // =====================================================
  // CURRENT LOGGED-IN USER
  // =====================================================

  currentUserCmrcId: number | null = null;
  currentUserCmrcName = '';
  currentUserDistrict = '';
  currentUserTaluka = '';
  currentUserAccountNo = '';
  currentUserAccountOpeningDate = '';

  // =====================================================
  // FORM MODEL
  // =====================================================

  newCmrc: Cmrc = this.emptyCmrc();

  // =====================================================
  // SEARCH
  // =====================================================

  searchText = '';

  // =====================================================
  // AMOUNT IN WORDS
  // =====================================================

  amountInWords = '';

  constructor(
    private cmrcService: CmrcService
  ) {}

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {
    this.loadCurrentUserDetails();
    this.loadCmrc();
  }

  // =====================================================
  // EMPTY CMRC MODEL
  // =====================================================

  private emptyCmrc(): Cmrc {
    return {
      cmrcName: '',
      district: '',
      taluka: '',
      accountNo: '',
      accountOpeningDate: '',
      status: 'ACTIVE',
      totalFund: 0
    };
  }

  // =====================================================
  // LOAD CURRENT USER DETAILS
  // =====================================================

  loadCurrentUserDetails(): void {
    this.errorMessage = '';

    const userData = localStorage.getItem('user');

    if (!userData) {
      this.currentUserCmrcId = null;
      this.cmrcList = [];
      this.errorMessage =
        'Login details not found. Please login again.';
      return;
    }

    try {
      const user = JSON.parse(userData);

      this.currentUserCmrcId =
        user.cmrcId != null && Number.isFinite(Number(user.cmrcId))
          ? Number(user.cmrcId)
          : null;

      this.currentUserCmrcName = user.cmrcName || '';
      this.currentUserDistrict = user.district || '';
      this.currentUserTaluka = user.taluka || '';
      this.currentUserAccountNo = user.accountNo || '';

      this.currentUserAccountOpeningDate =
        user.accountOpeningDate || '';

      const role = String(
        user.role || user.userRole || ''
      ).toUpperCase();

      this.isAdmin = role === 'ADMIN';

      if (this.currentUserCmrcId == null) {
        this.errorMessage =
          'No CMRC is assigned to the logged-in user.';
      }

    } catch (error) {
      console.error(
        'Unable to read login response:',
        error
      );

      this.currentUserCmrcId = null;
      this.isAdmin = false;
      this.cmrcList = [];

      this.errorMessage =
        'Unable to read login details. Please login again.';
    }
  }

  // =====================================================
  // LOAD LOGGED-IN USER'S CMRC
  // =====================================================

  loadCmrc(): void {
    if (this.currentUserCmrcId == null) {
      this.cmrcList = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.cmrcService.getAll().subscribe({
      next: (data: Cmrc[]) => {

        const existingCmrc = (data || []).find(
          (cmrc: Cmrc) =>
            Number(cmrc.id) ===
            Number(this.currentUserCmrcId)
        );

        if (!existingCmrc) {
          this.cmrcList = [];
          this.errorMessage =
            'CMRC record not found for the logged-in user.';
          this.isLoading = false;
          return;
        }

        // API is the source of truth for balance and status.
        // Login details are used as fallback for profile fields.
        const loggedInCmrc: Cmrc = {
          ...existingCmrc,

          cmrcName:
            existingCmrc.cmrcName ||
            this.currentUserCmrcName,

          district:
            existingCmrc.district ||
            this.currentUserDistrict,

          taluka:
            existingCmrc.taluka ||
            this.currentUserTaluka,

          accountNo:
            existingCmrc.accountNo ||
            this.currentUserAccountNo,

          accountOpeningDate:
            existingCmrc.accountOpeningDate ||
            this.currentUserAccountOpeningDate
        };

        this.cmrcList = [loggedInCmrc];
        this.isLoading = false;
      },

      error: (error) => {
        console.error('Load CMRC Error:', error);

        this.cmrcList = [];
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage =
            'Your session has expired. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage =
            'You are not authorized to view this CMRC.';
        } else {
          this.errorMessage =
            error?.error?.message ||
            'Unable to load CMRC details. Please try again.';
        }
      }
    });
  }

  // =====================================================
  // REFRESH REPORT
  // =====================================================

  refreshCmrc(): void {
    if (this.isLoading || this.isSaving) {
      return;
    }

    this.successMessage = '';
    this.loadCmrc();
  }

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(cmrc: Cmrc): void {
    if (!this.isAdmin) {
      this.errorMessage =
        'Only ADMIN can edit CMRC balance and status.';
      return;
    }

    if (
      cmrc.id == null ||
      Number(cmrc.id) !== Number(this.currentUserCmrcId)
    ) {
      this.errorMessage =
        'You are not authorized to edit this CMRC.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.isEditMode = true;
    this.showForm = true;
    this.isSaving = false;

    this.newCmrc = {
      ...cmrc,
      totalFund: Number(cmrc.totalFund || 0)
    };

    this.updateAmountInWords();
  }

  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.showForm = false;
    this.isEditMode = false;
    this.amountInWords = '';
    this.newCmrc = this.emptyCmrc();
  }

  // =====================================================
  // SAVE CMRC BALANCE AND STATUS
  // =====================================================

  saveCmrc(): void {
    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isAdmin) {
      this.errorMessage =
        'Only ADMIN can update CMRC balance and status.';
      return;
    }

    const cmrcId = this.newCmrc.id;

    if (cmrcId == null) {
      this.errorMessage = 'CMRC ID is missing.';
      return;
    }

    if (
      Number(cmrcId) !== Number(this.currentUserCmrcId)
    ) {
      this.errorMessage =
        'You are not authorized to update this CMRC.';
      return;
    }

    const existingCmrc = this.cmrcList.find(
      (cmrc: Cmrc) =>
        Number(cmrc.id) === Number(cmrcId)
    );

    if (!existingCmrc) {
      this.errorMessage =
        'Existing CMRC record was not found.';
      return;
    }

    const balance = Number(this.newCmrc.totalFund);

    if (!Number.isFinite(balance) || balance < 0) {
      this.errorMessage =
        'Enter a valid balance greater than or equal to zero.';
      return;
    }

    const status = String(
      this.newCmrc.status || ''
    ).toUpperCase();

    if (
      status !== 'ACTIVE' &&
      status !== 'INACTIVE'
    ) {
      this.errorMessage =
        'Please select a valid CMRC status.';
      return;
    }

    // Preserve the existing profile fields.
    // Only balance and status are editable here.
    const updatedCmrc: Cmrc = {
      ...existingCmrc,
      totalFund: balance,
      status
    };

    this.isSaving = true;

    this.cmrcService.update(
      cmrcId,
      updatedCmrc
    ).subscribe({
      next: (response: Cmrc) => {

        const savedCmrc: Cmrc = {
          ...existingCmrc,
          ...(response || {}),

          id: cmrcId,
          totalFund: balance,
          status,

          cmrcName:
            existingCmrc.cmrcName ||
            this.currentUserCmrcName,

          district:
            existingCmrc.district ||
            this.currentUserDistrict,

          taluka:
            existingCmrc.taluka ||
            this.currentUserTaluka,

          accountNo:
            existingCmrc.accountNo ||
            this.currentUserAccountNo,

          accountOpeningDate:
            existingCmrc.accountOpeningDate ||
            this.currentUserAccountOpeningDate
        };

        this.cmrcList = [savedCmrc];

        this.isSaving = false;
        this.showForm = false;
        this.isEditMode = false;
        this.amountInWords = '';
        this.newCmrc = this.emptyCmrc();

        this.successMessage =
          'CMRC balance and status updated successfully.';

        // Reload persisted data from the backend.
        this.loadCmrc();
      },

      error: (error) => {
        console.error('Update CMRC Error:', error);

        this.isSaving = false;

        if (error.status === 403) {
          this.errorMessage =
            'Access denied. You cannot update this CMRC.';
        } else if (error.status === 401) {
          this.errorMessage =
            'Your session has expired. Please login again.';
        } else {
          this.errorMessage =
            error?.error?.message ||
            (typeof error?.error === 'string'
              ? error.error
              : '') ||
            'Unable to update CMRC balance and status.';
        }
      }
    });
  }

  // =====================================================
  // FILTERED CMRC LIST
  // =====================================================

  get filteredCmrcList(): Cmrc[] {
    const search = this.searchText
      .trim()
      .toLowerCase();

    if (!search) {
      return this.cmrcList;
    }

    return this.cmrcList.filter((cmrc: Cmrc) =>
      (cmrc.cmrcName || '').toLowerCase().includes(search) ||
      (cmrc.accountNo || '').toLowerCase().includes(search) ||
      (cmrc.district || '').toLowerCase().includes(search) ||
      (cmrc.taluka || '').toLowerCase().includes(search) ||
      (cmrc.status || '').toLowerCase().includes(search)
    );
  }

  // =====================================================
  // TOTAL CMRC BALANCE
  // =====================================================

  get totalCmrcAmount(): number {
    return this.cmrcList.reduce(
      (total: number, cmrc: Cmrc) =>
        total + Number(cmrc.totalFund || 0),
      0
    );
  }

  // =====================================================
  // FORMATTED BALANCE
  // =====================================================

  formatCurrency(amount: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  }

  // =====================================================
  // UPDATE AMOUNT IN WORDS
  // =====================================================

  updateAmountInWords(): void {
    const amount = Number(
      this.newCmrc.totalFund || 0
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      this.amountInWords = '';
      return;
    }

    this.amountInWords = this.numberToWords(amount);
  }

  // =====================================================
  // NUMBER TO WORDS
  // =====================================================

  numberToWords(num: number): string {
    if (!Number.isFinite(num) || num < 0) {
      return '';
    }

    if (num === 0) {
      return 'Zero Rupees Only';
    }

    const integerPart = Math.floor(num);
    const decimalPart = Math.round(
      (num - integerPart) * 100
    );

    let result = '';

    if (integerPart > 0) {
      result += this.convertIndianNumber(integerPart);
      result += integerPart === 1
        ? ' Rupee'
        : ' Rupees';
    }

    if (decimalPart > 0) {
      if (result) {
        result += ' and ';
      }

      result += this.convertIndianNumber(decimalPart);
      result += decimalPart === 1
        ? ' Paisa'
        : ' Paise';
    }

    return result + ' Only';
  }

  // =====================================================
  // INDIAN NUMBER CONVERSION
  // =====================================================

  private convertIndianNumber(num: number): string {
    if (num === 0) {
      return 'Zero';
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

    const convertBelowThousand = (
      n: number
    ): string => {
      let words = '';

      if (n >= 100) {
        words +=
          ones[Math.floor(n / 100)] +
          ' Hundred';

        n %= 100;

        if (n > 0) {
          words += ' ';
        }
      }

      if (n >= 20) {
        words += tens[Math.floor(n / 10)];
        n %= 10;

        if (n > 0) {
          words += ' ' + ones[n];
        }
      } else if (n > 0) {
        words += ones[n];
      }

      return words;
    };

    let result = '';

    if (num >= 10000000) {
      result +=
        this.convertIndianNumber(
          Math.floor(num / 10000000)
        ) + ' Crore';

      num %= 10000000;

      if (num > 0) {
        result += ' ';
      }
    }

    if (num >= 100000) {
      result +=
        this.convertIndianNumber(
          Math.floor(num / 100000)
        ) + ' Lakh';

      num %= 100000;

      if (num > 0) {
        result += ' ';
      }
    }

    if (num >= 1000) {
      result +=
        this.convertIndianNumber(
          Math.floor(num / 1000)
        ) + ' Thousand';

      num %= 1000;

      if (num > 0) {
        result += ' ';
      }
    }

    if (num > 0) {
      result += convertBelowThousand(num);
    }

    return result;
  }
}
