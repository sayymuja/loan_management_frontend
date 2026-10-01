import { Component, OnInit } from '@angular/core';
import { Cmrc, CmrcService } from '../services/cmrc.service';

@Component({
  selector: 'app-cmrc',
  templateUrl: './cmrc.component.html',
  styleUrls: ['./cmrc.component.css']
})
export class CmrcComponent implements OnInit {

  // =====================================================
  // CMRC LIST
  // =====================================================

  cmrcList: Cmrc[] = [];


  // =====================================================
  // FORM STATE
  // =====================================================

  showForm = false;
  isEditMode = false;
  isSaving = false;
  deletingId: number | null = null;


  // =====================================================
  // CURRENT LOGGED-IN USER CMRC
  // =====================================================

  currentUserCmrcId: number | null = null;
  currentUserCmrcName = '';
  currentUserDistrict = '';
  currentUserTaluka = '';


  // =====================================================
  // FORM MODEL
  // =====================================================

  newCmrc: Cmrc = {
    cmrcName: '',
    district: '',
    taluka: '',
    accountNo: '',
    accountOpeningDate: '',
    status: 'ACTIVE',
    totalFund: 0
  };


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
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadCurrentUserDetails();

    this.loadCmrc();
  }


  // =====================================================
  // LOAD CURRENT USER DETAILS
  // =====================================================

  loadCurrentUserDetails(): void {

    const userData =
      localStorage.getItem('user');

    if (!userData) {
      return;
    }

    try {

      const user = JSON.parse(userData);

      this.currentUserCmrcId =
        user.cmrcId || null;

      this.currentUserCmrcName =
        user.cmrcName || '';

      this.currentUserDistrict =
        user.district || '';

      this.currentUserTaluka =
        user.taluka || '';


      this.newCmrc = {
        cmrcName:
          this.currentUserCmrcName,

        district:
          this.currentUserDistrict,

        taluka:
          this.currentUserTaluka,

        accountNo: '',

        accountOpeningDate:
          this.getTodayDate(),

        status: 'ACTIVE',

        totalFund: 0
      };

    } catch (error) {

      console.error(
        'Unable to read logged-in user',
        error
      );
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

        error: (error) => {

          console.error(
            'Load CMRC Error:',
            error
          );

          this.cmrcList = [];
        }

      });
  }


  // =====================================================
  // OPEN ADD BALANCE FORM
  // =====================================================

  openAddForm(): void {

    this.isEditMode = false;

    this.showForm = true;

    this.isSaving = false;

    this.amountInWords = '';


    /*
     * IMPORTANT:
     *
     * Find the existing CMRC record.
     * We are NOT creating a new CMRC.
     */

    const existingCmrc =
      this.cmrcList.find(
        (cmrc: Cmrc) =>
          cmrc.id === this.currentUserCmrcId
      );


    this.newCmrc = {

      id:
        existingCmrc?.id ||
        this.currentUserCmrcId ||
        undefined,

      cmrcName:
        this.currentUserCmrcName,

      district:
        this.currentUserDistrict,

      taluka:
        this.currentUserTaluka,

      accountNo:
        existingCmrc?.accountNo || '',

      accountOpeningDate:
        existingCmrc?.accountOpeningDate ||
        this.getTodayDate(),

      status:
        existingCmrc?.status ||
        'ACTIVE',

      /*
       * This field contains ONLY the new amount
       * entered by the user.
       */
      totalFund: 0
    };
  }


  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(cmrc: Cmrc): void {

    this.isEditMode = true;

    this.showForm = true;

    this.isSaving = false;


    this.newCmrc = {

      ...cmrc,

      cmrcName:
        this.currentUserCmrcName,

      district:
        this.currentUserDistrict,

      taluka:
        this.currentUserTaluka

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
  }


  // =====================================================
  // SAVE CMRC / ADD BALANCE
  // =====================================================

  saveCmrc(): void {

    if (this.isSaving) {
      return;
    }


    // =================================================
    // ADD BALANCE TO EXISTING CMRC
    // =================================================

    if (!this.isEditMode) {

      const amount =
        Number(this.newCmrc.totalFund || 0);


      // -----------------------------------------------
      // Validate amount
      // -----------------------------------------------

      if (amount <= 0) {

        alert(
          'Please enter a balance amount greater than 0.'
        );

        return;
      }


      // -----------------------------------------------
      // Existing CMRC ID
      // -----------------------------------------------

      const cmrcId =
        this.newCmrc.id ||
        this.currentUserCmrcId;


      if (!cmrcId) {

        alert(
          'Existing CMRC ID is missing.'
        );

        return;
      }


      // -----------------------------------------------
      // Find existing CMRC
      // -----------------------------------------------

      const existingCmrc =
        this.cmrcList.find(
          (cmrc: Cmrc) =>
            cmrc.id === cmrcId
        );


      if (!existingCmrc) {

        alert(
          'Existing CMRC record was not found.'
        );

        return;
      }


      // -----------------------------------------------
      // Calculate NEW balance
      // -----------------------------------------------

      const existingBalance =
        Number(
          existingCmrc.totalFund || 0
        );


      const updatedBalance =
        existingBalance + amount;


      // -----------------------------------------------
      // Prepare existing CMRC update
      // -----------------------------------------------

      const updatedCmrc: Cmrc = {

        ...existingCmrc,

        id: cmrcId,

        cmrcName:
          this.currentUserCmrcName,

        district:
          this.currentUserDistrict,

        taluka:
          this.currentUserTaluka,

        /*
         * IMPORTANT:
         *
         * Existing balance + new amount
         */
        totalFund:
          updatedBalance
      };


      console.log(
        'Existing CMRC ID:',
        cmrcId
      );

      console.log(
        'Existing Balance:',
        existingBalance
      );

      console.log(
        'Amount Added:',
        amount
      );

      console.log(
        'Updated Balance:',
        updatedBalance
      );

      console.log(
        'PUT CMRC Payload:',
        updatedCmrc
      );


      this.isSaving = true;


      // -----------------------------------------------
      // UPDATE EXISTING CMRC
      // -----------------------------------------------

      this.cmrcService
        .update(
          cmrcId,
          updatedCmrc
        )
        .subscribe({

          next: (response: Cmrc) => {

            console.log(
              'Existing CMRC Updated:',
              response
            );


            alert(
              'Balance added successfully.'
            );


            this.isSaving = false;

            this.showForm = false;

            this.isEditMode = false;

            this.amountInWords = '';


            // -----------------------------------------
            // Refresh from database
            // -----------------------------------------

            this.loadCmrc();
          },


          error: (error) => {

            console.error(
              'Add Balance / Update CMRC Error:',
              error
            );


            this.isSaving = false;


            if (error.status === 403) {

              alert(
                'Access denied for this CMRC.'
              );

            } else if (error.status === 401) {

              alert(
                'Session expired. Please login again.'
              );

            } else {

              alert(
                error?.error?.message ||
                error?.error ||
                'Unable to update CMRC balance.'
              );
            }

          }

        });


      return;
    }


    // =================================================
    // EDIT EXISTING CMRC DETAILS
    // =================================================

    if (!this.newCmrc.id) {

      alert(
        'CMRC ID is missing.'
      );

      return;
    }


    this.isSaving = true;


    this.cmrcService
      .update(
        this.newCmrc.id,
        this.newCmrc
      )
      .subscribe({

        next: (response: Cmrc) => {

          console.log(
            'CMRC Updated:',
            response
          );


          alert(
            'CMRC updated successfully.'
          );


          this.isSaving = false;

          this.showForm = false;

          this.isEditMode = false;

          this.amountInWords = '';


          this.loadCmrc();
        },


        error: (error) => {

          console.error(
            'Update CMRC Error:',
            error
          );


          this.isSaving = false;


          if (error.status === 403) {

            alert(
              'Access denied for this CMRC.'
            );

          } else if (error.status === 401) {

            alert(
              'Session expired. Please login again.'
            );

          } else {

            alert(
              error?.error?.message ||
              error?.error ||
              'Unable to update CMRC.'
            );
          }

        }

      });
  }


  // =====================================================
  // DELETE CMRC
  // =====================================================

  deleteCmrc(id?: number): void {

    if (!id) {
      return;
    }


    const confirmed =
      confirm(
        'Are you sure you want to delete this CMRC?'
      );


    if (!confirmed) {
      return;
    }


    this.deletingId = id;


    this.cmrcService
      .delete(id)
      .subscribe({

        next: () => {

          alert(
            'CMRC deleted successfully.'
          );

          this.deletingId = null;

          this.loadCmrc();
        },


        error: (error) => {

          console.error(
            'Delete CMRC Error:',
            error
          );

          this.deletingId = null;


          if (error.status === 403) {

            alert(
              'Access denied for this CMRC.'
            );

          } else {

            alert(
              error?.error?.message ||
              error?.error ||
              'Unable to delete CMRC.'
            );
          }

        }

      });
  }


  // =====================================================
  // FILTERED CMRC
  // =====================================================

  get filteredCmrcList(): Cmrc[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    if (!search) {
      return this.cmrcList;
    }


    return this.cmrcList.filter(
      (cmrc: Cmrc) =>

        (cmrc.cmrcName || '')
          .toLowerCase()
          .includes(search)

        ||

        (cmrc.accountNo || '')
          .toLowerCase()
          .includes(search)

        ||

        (cmrc.district || '')
          .toLowerCase()
          .includes(search)

        ||

        (cmrc.taluka || '')
          .toLowerCase()
          .includes(search)

        ||

        (cmrc.status || '')
          .toLowerCase()
          .includes(search)
    );
  }


  // =====================================================
  // TOTAL CMRC BALANCE
  // =====================================================

  get totalCmrcAmount(): number {

    return this.cmrcList.reduce(
      (
        total: number,
        cmrc: Cmrc
      ) =>
        total +
        Number(cmrc.totalFund || 0),
      0
    );
  }


  // =====================================================
  // AMOUNT CHANGE
  // =====================================================

  updateAmountInWords(): void {

    const amount =
      Number(this.newCmrc.totalFund || 0);


    if (amount <= 0) {

      this.amountInWords = '';

      return;
    }


    this.amountInWords =
      this.numberToWords(amount);
  }


  // =====================================================
  // NUMBER TO WORDS
  // =====================================================

  numberToWords(num: number): string {

    if (!Number.isFinite(num)) {
      return '';
    }


    if (num === 0) {
      return 'Zero Rupees Only';
    }


    const integerPart =
      Math.floor(num);


    const decimalPart =
      Math.round(
        (num - integerPart) * 100
      );


    let result = '';


    if (integerPart > 0) {

      result +=
        this.convertIndianNumber(
          integerPart
        );

      result +=
        integerPart === 1
          ? ' Rupee'
          : ' Rupees';
    }


    if (decimalPart > 0) {

      if (result) {
        result += ' and ';
      }

      result +=
        this.convertIndianNumber(
          decimalPart
        );

      result +=
        decimalPart === 1
          ? ' Paisa'
          : ' Paise';
    }


    return result + ' Only';
  }


  // =====================================================
  // INDIAN NUMBER CONVERSION
  // =====================================================

  private convertIndianNumber(
    num: number
  ): string {

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


    const convertBelowThousand =
      (n: number): string => {

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

          words +=
            tens[Math.floor(n / 10)];

          n %= 10;


          if (n > 0) {
            words +=
              ' ' + ones[n];
          }

        } else if (n > 0) {

          words += ones[n];
        }


        return words;
      };


    let result = '';


    // Crore
    if (num >= 10000000) {

      result +=
        this.convertIndianNumber(
          Math.floor(num / 10000000)
        ) +
        ' Crore';

      num %= 10000000;

      if (num > 0) {
        result += ' ';
      }
    }


    // Lakh
    if (num >= 100000) {

      result +=
        this.convertIndianNumber(
          Math.floor(num / 100000)
        ) +
        ' Lakh';

      num %= 100000;

      if (num > 0) {
        result += ' ';
      }
    }


    // Thousand
    if (num >= 1000) {

      result +=
        this.convertIndianNumber(
          Math.floor(num / 1000)
        ) +
        ' Thousand';

      num %= 1000;

      if (num > 0) {
        result += ' ';
      }
    }


    // Below thousand
    if (num > 0) {

      result +=
        convertBelowThousand(num);
    }


    return result;
  }


  // =====================================================
  // TODAY DATE
  // =====================================================

  private getTodayDate(): string {

    const today =
      new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        today.getDate()
      ).padStart(2, '0');


    return `${year}-${month}-${day}`;
  }

}