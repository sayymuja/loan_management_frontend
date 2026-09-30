import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  VoAlfService,
  VoAlf
} from '../services/vo-alf.service';

import {
  CmrcService,
  Cmrc
} from '../services/cmrc.service';

@Component({
  selector: 'app-vo-alf',
  templateUrl: './vo-alf.component.html',
  styleUrls: ['./vo-alf.component.css']
})
export class VoAlfComponent implements OnInit {

  // =====================================================
  // CMRC
  // =====================================================

  cmrcList: Cmrc[] = [];

  selectedCmrcId: number | null = null;


  // =====================================================
  // VO / ALF
  // =====================================================

  voAlfList: VoAlf[] = [];

  newVoAlf: VoAlf = {
    cmrcId: 0,
    villageName: '',
    voAlfName: '',
    accountNo: '',
    receivedFund: 0
  };


  // =====================================================
  // FORM STATE
  // =====================================================

  showForm = false;

  isEditMode = false;

  isLoading = false;

  isSaving = false;

  deletingId: number | null = null;


  // =====================================================
  // CMRC BALANCE
  // =====================================================

  /*
   * CMRC total balance comes directly from
   * selected CMRC.totalFund
   */

  cmrcBalance = 0;

  totalReceivedFund = 0;

  cmrcLeftBalance = 0;


  // =====================================================
  // EDIT SUPPORT
  // =====================================================

  originalReceivedFund = 0;


  // =====================================================
  // VILLAGES
  // =====================================================

  villages: string[] = [];


  /*
   * Temporary village master.
   *
   * Sonpeth Taluka villages are included here.
   *
   * Later this can be replaced by Village API.
   */

  villageMap: { [key: string]: string[] } = {

    'Sonpeth': [
      'Sonpeth',
      'Sonkhed',
      'Dahikhed',
      'Vita Khurd',
      'Lasina',
      'Dudhgaon',
      'Vanisangam',
      'Waghalgaon',
      'Shelgaon M.',
      'Shelgaon H.',
      'Bhaucha Tanda',
      'Thadi Pimpalgaon',
      'Wadi Pimpalgaon',
      'Gaganpipri',
      'Golegaon',
      'Thadi Ukkadgaon',
      'Shirshi Bk.',
      'Shiroli',
      'Lohigram',
      'Lohigram Tanda',
      'Sakharam Tanda',
      'Gavli Pimppri',
      'Kapatpimpri',
      'Nimgaon',
      'Dighol E.',
      'Dhar Dighol',
      'Revatanda',
      'Awalgaon',
      'Bhisegaon',
      'Mohala',
      'Korntek',
      'Pohandul',
      'Vandan',
      'Tivthana',
      'Pohandul Tanda',
      'Dhamoni',
      'Bondargaon',
      'Kothala',
      'Kothala Tanda',
      'Chukar Pimpri',
      'Kanhegaon',
      'Khadka',
      'Dhobadi Tanda',
      'Naikota',
      'Ukkadgaon M.',
      'Wadi Naikota',
      'Karam',
      'Narwadi',
      'Saykhed',
      'Devinagar',
      'Munshiram Tanda',
      'Tukaitanda',
      'Wadgaon',
      'Margalwadi',
      'Nila',
      'Waitagwadi',
      'Ukhali Bk.',
      'Paradhwadi',
      'Buktarwadi',
      'Ukhali Tanda'
    ]

  };


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService
  ) {}


  // =====================================================
  // ON INIT
  // =====================================================

  ngOnInit(): void {
    this.loadCmrc();
    this.loadAllVoAlf();
  }
  loadAllVoAlf(): void {
  this.voAlfService.getAll().subscribe({
    next: (data: VoAlf[]) => {
      this.voAlfList = data || [];

      this.totalReceivedFund = this.voAlfList.reduce(
        (total, item) => total + Number(item.receivedFund || 0),
        0
      );
    },
    error: (error) => {
      console.error('Error loading all VO / ALF records:', error);
      this.voAlfList = [];
      this.totalReceivedFund = 0;
    }
  });
}


  // =====================================================
  // LOAD CMRC
  // =====================================================

  loadCmrc(): void {

    this.isLoading = true;

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        this.isLoading = false;

      },

      error: (error) => {

        console.error(
          'CMRC API Error:',
          error
        );

        this.isLoading = false;

        alert(
          'Unable to load CMRC data.'
        );

      }

    });

  }


  // =====================================================
  // LOAD VO / ALF BY CMRC
  // =====================================================

  loadVoAlfByCmrc(): void {

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      this.voAlfList = [];

      this.cmrcBalance = 0;

      this.totalReceivedFund = 0;

      this.cmrcLeftBalance = 0;

      this.villages = [];

      this.closeForm();

      return;
    }


    // =================================================
    // GET SELECTED CMRC
    // =================================================

    const selectedCmrc =
      this.getSelectedCmrc();


    /*
     * CMRC Total Balance comes from
     * CMRC.totalFund
     */

    this.cmrcBalance =
      Number(
        selectedCmrc?.totalFund || 0
      );


    // =================================================
    // LOAD VILLAGES BY TALUKA
    // =================================================

    this.loadVillagesBySelectedTaluka();


    // =================================================
    // LOAD VO / ALF
    // =================================================

    this.isLoading = true;

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList =
            data || [];

          console.log(
            'VO / ALF Data:',
            this.voAlfList
          );

          this.calculateTotalReceivedFund();

          this.isLoading = false;

        },

        error: (error) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.voAlfList = [];

          this.totalReceivedFund = 0;

          this.calculateLeftBalance();

          this.isLoading = false;

          alert(
            'Unable to load VO / ALF data.'
          );

        }

      });

  }


  // =====================================================
  // LOAD VILLAGES BY SELECTED TALUKA
  // =====================================================

  loadVillagesBySelectedTaluka(): void {

    const taluka =
      this.getSelectedCmrcTaluka();


    if (
      !taluka ||
      taluka === '-'
    ) {

      this.villages = [];

      return;
    }


    this.villages =
      this.villageMap[taluka] || [];


    /*
     * During edit, keep selected village
     * visible if it is not in master list.
     */

    if (
      this.newVoAlf.villageName &&
      !this.villages.includes(
        this.newVoAlf.villageName
      )
    ) {

      this.villages = [
        this.newVoAlf.villageName,
        ...this.villages
      ];

    }

  }


  // =====================================================
  // CALCULATE TOTAL RECEIVED
  // =====================================================

  calculateTotalReceivedFund(): void {

    this.totalReceivedFund =
      this.voAlfList.reduce(
        (
          total: number,
          item: VoAlf
        ) => {

          return total +
            Number(
              item.receivedFund || 0
            );

        },
        0
      );


    this.calculateLeftBalance();

  }


  // =====================================================
  // CALCULATE LEFT BALANCE
  // =====================================================

  calculateLeftBalance(): void {

    this.cmrcLeftBalance =
      Number(
        this.cmrcBalance || 0
      )
      -
      Number(
        this.totalReceivedFund || 0
      );

  }


  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  openAddForm(): void {

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      alert(
        'Please select CMRC first.'
      );

      return;
    }


    this.newVoAlf = {

      cmrcId:
        this.selectedCmrcId,

      villageName: '',

      voAlfName: '',

      accountNo: '',

      receivedFund: 0

    };


    this.originalReceivedFund = 0;


    this.isEditMode = false;

    this.showForm = true;


    this.loadVillagesBySelectedTaluka();

  }


  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(
    voAlf: VoAlf
  ): void {

    this.newVoAlf = {
      ...voAlf
    };


    this.originalReceivedFund =
      Number(
        voAlf.receivedFund || 0
      );


    this.isEditMode = true;

    this.showForm = true;


    this.loadVillagesBySelectedTaluka();

  }


  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.originalReceivedFund = 0;


    this.newVoAlf = {

      cmrcId:
        this.selectedCmrcId ?? 0,

      villageName: '',

      voAlfName: '',

      accountNo: '',

      receivedFund: 0

    };

  }


  // =====================================================
  // SAVE / UPDATE
  // =====================================================

  saveVoAlf(): void {

    // =================================================
    // CMRC VALIDATION
    // =================================================

    if (
      !this.newVoAlf.cmrcId ||
      this.newVoAlf.cmrcId <= 0
    ) {

      alert(
        'Please select CMRC.'
      );

      return;
    }


    // =================================================
    // VILLAGE VALIDATION
    // =================================================

    if (
      !this.newVoAlf.villageName ||
      !this.newVoAlf.villageName.trim()
    ) {

      alert(
        'Please select village.'
      );

      return;
    }


    // =================================================
    // VO / ALF VALIDATION
    // =================================================

    if (
      !this.newVoAlf.voAlfName ||
      !this.newVoAlf.voAlfName.trim()
    ) {

      alert(
        'Please enter VO / ALF name.'
      );

      return;
    }


    // =================================================
    // RECEIVED FUND
    // =================================================

    const receivedFund =
      Number(
        this.newVoAlf.receivedFund || 0
      );


    if (receivedFund < 0) {

      alert(
        'Received Fund cannot be negative.'
      );

      return;
    }


    // =================================================
    // AVAILABLE BALANCE
    // =================================================

    let availableBalance =
      Number(
        this.cmrcBalance || 0
      );


    if (this.isEditMode) {

      /*
       * Remove old amount first.
       */

      availableBalance =
        Number(this.cmrcBalance || 0)
        -
        (
          Number(this.totalReceivedFund || 0)
          -
          Number(this.originalReceivedFund || 0)
        );

    } else {

      availableBalance =
        Number(this.cmrcBalance || 0)
        -
        Number(this.totalReceivedFund || 0);

    }


    // =================================================
    // BALANCE VALIDATION
    // =================================================

    if (
      receivedFund > availableBalance
    ) {

      alert(
        'Received Fund cannot be greater than available CMRC balance.\n\n' +
        'Available Balance: ₹ ' +
        availableBalance.toFixed(2)
      );

      return;
    }


    // =================================================
    // NORMALIZE
    // =================================================

    this.newVoAlf.voAlfName =
      this.newVoAlf.voAlfName.trim();


    this.newVoAlf.villageName =
      this.newVoAlf.villageName.trim();


    this.newVoAlf.accountNo =
      this.newVoAlf.accountNo
        ? this.newVoAlf.accountNo.trim()
        : '';


    this.newVoAlf.receivedFund =
      receivedFund;


    // =================================================
    // UPDATE
    // =================================================

    if (
      this.isEditMode &&
      this.newVoAlf.id
    ) {

      this.isSaving = true;

      this.voAlfService
        .update(
          this.newVoAlf.id,
          this.newVoAlf
        )
        .subscribe({

          next: () => {

            this.isSaving = false;

            alert(
              'VO / ALF updated successfully.'
            );

            this.closeForm();

            this.loadVoAlfByCmrc();

          },

          error: (error) => {

            console.error(
              'Update VO / ALF Error:',
              error
            );

            this.isSaving = false;

            alert(
              'Unable to update VO / ALF.'
            );

          }

        });

      return;
    }


    // =================================================
    // CREATE
    // =================================================

    this.isSaving = true;

    this.voAlfService
      .create(this.newVoAlf)
      .subscribe({

        next: () => {

          this.isSaving = false;

          alert(
            'VO / ALF added successfully.'
          );

          this.closeForm();

          this.loadVoAlfByCmrc();

        },

        error: (error) => {

          console.error(
            'Create VO / ALF Error:',
            error
          );

          this.isSaving = false;

          alert(
            'Unable to create VO / ALF.'
          );

        }

      });

  }


  // =====================================================
  // DELETE
  // =====================================================

  deleteVoAlf(
    id: number
  ): void {

    if (
      !confirm(
        'Are you sure you want to delete this VO / ALF?'
      )
    ) {

      return;
    }


    this.deletingId = id;


    this.voAlfService
      .delete(id)
      .subscribe({

        next: () => {

          this.deletingId = null;

          alert(
            'VO / ALF deleted successfully.'
          );

          this.loadVoAlfByCmrc();

        },

        error: (error) => {

          console.error(
            'Delete VO / ALF Error:',
            error
          );

          this.deletingId = null;

          alert(
            'Unable to delete VO / ALF.'
          );

        }

      });

  }


  // =====================================================
  // GET SELECTED CMRC
  // =====================================================

  getSelectedCmrc(): Cmrc | undefined {

    return this.cmrcList.find(
      c => c.id === this.selectedCmrcId
    );

  }


  // =====================================================
  // CMRC NAME
  // =====================================================

  getSelectedCmrcName(): string {

    const cmrc =
      this.getSelectedCmrc();

    return cmrc?.cmrcName || '-';

  }


  // =====================================================
  // DISTRICT
  // =====================================================

  getSelectedCmrcDistrict(): string {

    const cmrc =
      this.getSelectedCmrc();

    return cmrc?.district || '-';

  }


  // =====================================================
  // TALUKA
  // =====================================================

  getSelectedCmrcTaluka(): string {

    const cmrc =
      this.getSelectedCmrc();

    return cmrc?.taluka || '-';

  }


  // =====================================================
  // RECEIVED FUND IN WORDS
  // =====================================================

  getReceivedFundInWords(): string {

    const amount =
      Number(
        this.newVoAlf.receivedFund || 0
      );


    if (
      !amount ||
      amount <= 0
    ) {

      return '';

    }


    return this.numberToWordsIndian(
      amount
    );

  }


  // =====================================================
  // BALANCE AFTER CURRENT ENTRY
  // =====================================================

  getBalanceAfterCurrentEntry(): number {

    const enteredAmount =
      Number(
        this.newVoAlf.receivedFund || 0
      );


    if (this.isEditMode) {

      return (

        Number(this.cmrcBalance || 0)

        -

        (
          Number(this.totalReceivedFund || 0)
          -
          Number(this.originalReceivedFund || 0)
        )

        -

        enteredAmount

      );

    }


    return (

      Number(this.cmrcBalance || 0)

      -

      Number(this.totalReceivedFund || 0)

      -

      enteredAmount

    );

  }


  // =====================================================
  // AMOUNT TO INDIAN WORDS
  // =====================================================

  private numberToWordsIndian(
    num: number
  ): string {

    if (
      !num ||
      num <= 0
    ) {

      return '';

    }


    num = Math.floor(num);


    const ones: string[] = [

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


    const tens: string[] = [

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


    const twoDigitWords =
      (n: number): string => {

        if (n < 20) {
          return ones[n];
        }

        const ten =
          Math.floor(n / 10);

        const one =
          n % 10;

        return (
          tens[ten] +
          (
            one > 0
              ? ' ' + ones[one]
              : ''
          )
        );

      };


    const convertBelowThousand =
      (n: number): string => {

        let result = '';

        if (n >= 100) {

          result =
            ones[
              Math.floor(n / 100)
            ] +
            ' Hundred';

          n = n % 100;

          if (n > 0) {

            result +=
              ' ' +
              twoDigitWords(n);

          }

        } else if (n > 0) {

          result =
            twoDigitWords(n);

        }

        return result;

      };


    let result = '';


    // CRORE
    if (num >= 10000000) {

      const crore =
        Math.floor(
          num / 10000000
        );

      result +=
        convertBelowThousand(crore)
        + ' Crore';

      num =
        num % 10000000;

      if (num > 0) {
        result += ' ';
      }

    }


    // LAKH
    if (num >= 100000) {

      const lakh =
        Math.floor(
          num / 100000
        );

      result +=
        convertBelowThousand(lakh)
        + ' Lakh';

      num =
        num % 100000;

      if (num > 0) {
        result += ' ';
      }

    }


    // THOUSAND
    if (num >= 1000) {

      const thousand =
        Math.floor(
          num / 1000
        );

      result +=
        convertBelowThousand(thousand)
        + ' Thousand';

      num =
        num % 1000;

      if (num > 0) {
        result += ' ';
      }

    }


    // REMAINING
    if (num > 0) {

      result +=
        convertBelowThousand(num);

    }


    return (
      result.trim()
      + ' Rupees Only'
    );

  }

}

