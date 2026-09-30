import { Component, OnInit } from '@angular/core';

import {
  CmrcService,
  Cmrc
} from '../services/cmrc.service';

@Component({
  selector: 'app-cmrc',
  templateUrl: './cmrc.component.html',
  styleUrls: ['./cmrc.component.css']
})
export class CmrcComponent implements OnInit {

  // =========================================================
  // CMRC LIST
  // =========================================================

  cmrcList: Cmrc[] = [];


  // =========================================================
  // FORM STATE
  // =========================================================

  showForm = false;
  isEditMode = false;
  isSaving = false;
  deletingId: number | null = null;


  // =========================================================
  // MAHARASHTRA DISTRICTS
  // =========================================================

  districts: string[] = [

    'Ahmednagar',
    'Akola',
    'Amravati',
    'Aurangabad',
    'Beed',
    'Bhandara',
    'Buldhana',
    'Chandrapur',
    'Dhule',
    'Gadchiroli',
    'Gondia',
    'Hingoli',
    'Jalgaon',
    'Jalna',
    'Kolhapur',
    'Latur',
    'Mumbai City',
    'Mumbai Suburban',
    'Nagpur',
    'Nanded',
    'Nandurbar',
    'Nashik',
    'Osmanabad',
    'Palghar',
    'Parbhani',
    'Pune',
    'Raigad',
    'Ratnagiri',
    'Sangli',
    'Satara',
    'Sindhudurg',
    'Solapur',
    'Thane',
    'Wardha',
    'Washim',
    'Yavatmal'

  ];


  // =========================================================
  // DISTRICT → TALUKA
  // =========================================================

  talukaMap: { [key: string]: string[] } = {

    'Ahmednagar': [
      'Ahmednagar',
      'Akole',
      'Jamkhed',
      'Karjat',
      'Kopargaon',
      'Nevasa',
      'Parner',
      'Pathardi',
      'Rahata',
      'Rahuri',
      'Sangamner',
      'Shevgaon',
      'Shrigonda',
      'Shrirampur'
    ],

    'Akola': [
      'Akola',
      'Akot',
      'Balapur',
      'Barshitakli',
      'Murtizapur',
      'Patur',
      'Telhara'
    ],

    'Amravati': [
      'Achalpur',
      'Amravati',
      'Anjangaon Surji',
      'Bhatkuli',
      'Chandur Bazar',
      'Chandur Railway',
      'Chikhaldara',
      'Daryapur',
      'Dhamangaon Railway',
      'Dharni',
      'Morshi',
      'Nandgaon Khandeshwar',
      'Teosa',
      'Warud'
    ],

    'Aurangabad': [
      'Aurangabad',
      'Kannad',
      'Khuldabad',
      'Paithan',
      'Phulambri',
      'Sillod',
      'Soegaon',
      'Vaijapur',
      'Gangapur'
    ],

    'Beed': [
      'Ambajogai',
      'Ashti',
      'Beed',
      'Dharur',
      'Georai',
      'Kaij',
      'Majalgaon',
      'Parli',
      'Patoda',
      'Shirur Kasar',
      'Wadwani'
    ],

    'Bhandara': [
      'Bhandara',
      'Lakhandur',
      'Lakhani',
      'Mohadi',
      'Pauni',
      'Sakoli',
      'Tumsar'
    ],

    'Buldhana': [
      'Buldhana',
      'Chikhli',
      'Deulgaon Raja',
      'Jalgaon Jamod',
      'Khamgaon',
      'Lonar',
      'Malkapur',
      'Mehkar',
      'Motala',
      'Nandura',
      'Shegaon',
      'Sindkhed Raja'
    ],

    'Chandrapur': [
      'Ballarpur',
      'Bhadravati',
      'Brahmapuri',
      'Chimur',
      'Chandrapur',
      'Gondpipri',
      'Jiwati',
      'Korpana',
      'Mul',
      'Nagbhir',
      'Pombhurna',
      'Rajura',
      'Sawali',
      'Sindewahi',
      'Warora'
    ],

    'Dhule': [
      'Dhule',
      'Sakri',
      'Shirpur',
      'Shindkheda'
    ],

    'Gadchiroli': [
      'Aheri',
      'Armori',
      'Bhamragad',
      'Chamorshi',
      'Dhanora',
      'Desaiganj',
      'Etapalli',
      'Gadchiroli',
      'Korchi',
      'Kurkheda',
      'Mulchera',
      'Sironcha'
    ],

    'Gondia': [
      'Amgaon',
      'Arjuni Morgaon',
      'Deori',
      'Gondia',
      'Goregaon',
      'Sadak Arjuni',
      'Salekasa',
      'Tirora'
    ],

    'Hingoli': [
      'Aundha Nagnath',
      'Basmath',
      'Hingoli',
      'Kalamnuri',
      'Sengaon'
    ],

    'Jalgaon': [
      'Amalner',
      'Bhadgaon',
      'Bhusawal',
      'Bodwad',
      'Chalisgaon',
      'Chopda',
      'Dharangaon',
      'Erandol',
      'Jalgaon',
      'Jamner',
      'Muktainagar',
      'Pachora',
      'Parola',
      'Raver',
      'Yawal'
    ],

    'Jalna': [
      'Ambad',
      'Badnapur',
      'Bhokardan',
      'Ghansawangi',
      'Jafferabad',
      'Jalna',
      'Mantha',
      'Partur'
    ],

    'Kolhapur': [
      'Ajra',
      'Bavda',
      'Bhudargad',
      'Chandgad',
      'Gadhinglaj',
      'Gaganbawada',
      'Hatkanangale',
      'Kagal',
      'Karveer',
      'Panhala',
      'Radhanagari',
      'Shahuwadi',
      'Shirol'
    ],

    'Latur': [
      'Ahmedpur',
      'Ausa',
      'Chakur',
      'Deoni',
      'Jalkot',
      'Latur',
      'Nilanga',
      'Renapur',
      'Shirur Anantpal',
      'Udgir'
    ],

    'Mumbai City': [
      'Mumbai City'
    ],

    'Mumbai Suburban': [
      'Andheri',
      'Borivali',
      'Kurla'
    ],

    'Nagpur': [
      'Bhiwapur',
      'Hingna',
      'Kalameshwar',
      'Kamptee',
      'Katol',
      'Kuhi',
      'Mouda',
      'Nagpur Rural',
      'Nagpur Urban',
      'Narkhed',
      'Parseoni',
      'Ramtek',
      'Savner',
      'Umred'
    ],

    'Nanded': [
      'Ardhapur',
      'Bhokar',
      'Biloli',
      'Deglur',
      'Dharmabad',
      'Hadgaon',
      'Himayatnagar',
      'Kandhar',
      'Kinwat',
      'Loha',
      'Mahur',
      'Mudkhed',
      'Mukhed',
      'Nanded',
      'Naigaon',
      'Umri'
    ],

    'Nandurbar': [
      'Akkalkuwa',
      'Akrani',
      'Nandurbar',
      'Navapur',
      'Shahada',
      'Taloda'
    ],

    'Nashik': [
      'Baglan',
      'Chandwad',
      'Deola',
      'Dindori',
      'Igatpuri',
      'Kalwan',
      'Malegaon',
      'Nandgaon',
      'Nashik',
      'Niphad',
      'Peint',
      'Sinnar',
      'Surgana',
      'Trimbakeshwar',
      'Yeola'
    ],

    'Osmanabad': [
      'Bhoom',
      'Kalamb',
      'Lohara',
      'Omerga',
      'Osmanabad',
      'Paranda',
      'Tuljapur',
      'Washi'
    ],

    'Palghar': [
      'Dahanu',
      'Jawhar',
      'Mokhada',
      'Palghar',
      'Talasari',
      'Vasai',
      'Vikramgad',
      'Wada'
    ],

    'Parbhani': [
      'Gangakhed',
      'Jintur',
      'Manwath',
      'Manwat',
      'Palam',
      'Parbhani',
      'Pathri',
      'Purna',
      'Sonpeth'
    ],

    'Pune': [
      'Ambegaon',
      'Baramati',
      'Bhor',
      'Daund',
      'Haveli',
      'Indapur',
      'Junnar',
      'Khed',
      'Mawal',
      'Mulshi',
      'Purandar',
      'Shirur',
      'Velhe'
    ],

    'Raigad': [
      'Alibag',
      'Karjat',
      'Khalapur',
      'Mahad',
      'Mangaon',
      'Mhasla',
      'Murud',
      'Panvel',
      'Pen',
      'Poladpur',
      'Roha',
      'Shrivardhan',
      'Sudhagad',
      'Tala',
      'Uran'
    ],

    'Ratnagiri': [
      'Chiplun',
      'Dapoli',
      'Guhagar',
      'Khed',
      'Lanja',
      'Mandangad',
      'Rajapur',
      'Ratnagiri',
      'Sangameshwar'
    ],

    'Sangli': [
      'Atpadi',
      'Jat',
      'Kadegaon',
      'Kavathe Mahankal',
      'Khanapur',
      'Miraj',
      'Palus',
      'Shirala',
      'Tasgaon',
      'Walwa'
    ],

    'Satara': [
      'Jaoli',
      'Karad',
      'Khandala',
      'Khatav',
      'Koregaon',
      'Mahabaleshwar',
      'Man',
      'Patan',
      'Phaltan',
      'Satara',
      'Wai'
    ],

    'Sindhudurg': [
      'Deogad',
      'Dodamarg',
      'Kankavli',
      'Kudal',
      'Malvan',
      'Sawantwadi',
      'Vaibhavwadi',
      'Vengurla'
    ],

    'Solapur': [
      'Akkalkot',
      'Barshi',
      'Karmala',
      'Madha',
      'Malshiras',
      'Mangalvedhe',
      'Mohol',
      'Pandharpur',
      'Sangole',
      'Solapur North',
      'Solapur South'
    ],

    'Thane': [
      'Ambernath',
      'Bhiwandi',
      'Kalyan',
      'Murbad',
      'Shahapur',
      'Thane',
      'Ulhasnagar'
    ],

    'Wardha': [
      'Arvi',
      'Ashti',
      'Deoli',
      'Hinganghat',
      'Karanja',
      'Samudrapur',
      'Seloo',
      'Wardha'
    ],

    'Washim': [
      'Karanja',
      'Malegaon',
      'Mangrulpir',
      'Manora',
      'Risod',
      'Washim'
    ],

    'Yavatmal': [
      'Arni',
      'Babhulgaon',
      'Darwha',
      'Digras',
      'Ghatanji',
      'Kalamb',
      'Kelapur',
      'Mahagaon',
      'Maregaon',
      'Ner',
      'Pusad',
      'Ralegaon',
      'Umarkhed',
      'Wani',
      'Yavatmal',
      'Zari-Jamani'
    ]

  };


  // =========================================================
  // SELECTED DISTRICT KE TALUKA
  // =========================================================

  get talukas(): string[] {

    if (!this.newCmrc.district) {
      return [];
    }

    return this.talukaMap[this.newCmrc.district] || [];

  }


  // =========================================================
  // DISTRICT CHANGE
  // =========================================================

  onDistrictChange(): void {

    /*
     * District change hone par
     * purana Taluka clear hoga.
     */

    this.newCmrc.taluka = '';

  }


  // =========================================================
  // NEW / EDIT CMRC
  // =========================================================

  newCmrc: Cmrc = {

    cmrcName: '',
    accountNo: '',
    accountOpeningDate: '',
    district: '',
    taluka: '',
    status: 'ACTIVE',
    totalFund: 0

  };


  // =========================================================
  // SEARCH
  // =========================================================

  searchText = '';


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private cmrcService: CmrcService
  ) {}


  // =========================================================
  // ON INIT
  // =========================================================

  ngOnInit(): void {

    this.loadCmrc();

  }


  // =========================================================
  // LOAD ALL CMRC
  // =========================================================

  loadCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        console.log(
          'CMRC List:',
          this.cmrcList
        );

      },

      error: (error) => {

        console.error(
          'Load CMRC Error:',
          error
        );

        alert(
          'Unable to load CMRC records'
        );

      }

    });

  }


  // =========================================================
  // GET TODAY DATE
  // =========================================================

  private getTodayDate(): string {

    const today = new Date();

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


  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  openAddForm(): void {

    this.isEditMode = false;

    this.isSaving = false;

    this.newCmrc = {

      cmrcName: '',

      accountNo: '',

      accountOpeningDate:
        this.getTodayDate(),

      district: '',

      taluka: '',

      status: 'ACTIVE',

      totalFund: 0

    };

    this.showForm = true;

  }


  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  openEditForm(cmrc: Cmrc): void {

    this.isEditMode = true;

    this.isSaving = false;

    this.newCmrc = {

      ...cmrc,

      cmrcName:
        cmrc.cmrcName || '',

      accountNo:
        cmrc.accountNo || '',

      accountOpeningDate:
        cmrc.accountOpeningDate ||
        this.getTodayDate(),

      district:
        cmrc.district || '',

      taluka:
        cmrc.taluka || '',

      status:
        cmrc.status || 'ACTIVE',

      totalFund:
        Number(
          cmrc.totalFund || 0
        )

    };

    this.showForm = true;

  }


  // =========================================================
  // CLOSE FORM
  // =========================================================

  closeForm(): void {

    if (this.isSaving) {
      return;
    }

    this.showForm = false;

    this.isEditMode = false;

    this.isSaving = false;

    this.resetForm();

  }


  // =========================================================
  // RESET FORM
  // =========================================================

  private resetForm(): void {

    this.newCmrc = {

      cmrcName: '',

      accountNo: '',

      accountOpeningDate: '',

      district: '',

      taluka: '',

      status: 'ACTIVE',

      totalFund: 0

    };

  }


  // =========================================================
  // SAVE / UPDATE CMRC
  // =========================================================

  saveCmrc(): void {

    if (this.isSaving) {
      return;
    }

    this.isSaving = true;


    // =======================================================
    // UPDATE
    // =======================================================

    if (this.isEditMode) {

      if (this.newCmrc.id == null) {

        alert(
          'CMRC ID is missing'
        );

        this.isSaving = false;

        return;

      }

      const id =
        this.newCmrc.id;

      this.cmrcService
        .update(
          id,
          this.newCmrc
        )
        .subscribe({

          next: (response) => {

            console.log(
              'CMRC Updated:',
              response
            );

            alert(
              'CMRC updated successfully'
            );

            this.showForm = false;

            this.isEditMode = false;

            this.isSaving = false;

            this.resetForm();

            this.loadCmrc();

          },

          error: (error) => {

            console.error(
              'Update CMRC Error:',
              error
            );

            alert(
              'CMRC update failed. Please check the backend API.'
            );

            this.isSaving = false;

          }

        });

      return;

    }


    // =======================================================
    // CREATE
    // =======================================================

    this.cmrcService
      .create(
        this.newCmrc
      )
      .subscribe({

        next: (response) => {

          console.log(
            'CMRC Created:',
            response
          );

          alert(
            'CMRC added successfully'
          );

          this.showForm = false;

          this.isEditMode = false;

          this.isSaving = false;

          this.resetForm();

          this.loadCmrc();

        },

        error: (error) => {

          console.error(
            'Create CMRC Error:',
            error
          );

          alert(
            'CMRC creation failed. Please check the backend API.'
          );

          this.isSaving = false;

        }

      });

  }


  // =========================================================
  // DELETE CMRC
  // =========================================================

  deleteCmrc(
    id: number | undefined
  ): void {

    if (id == null) {

      alert(
        'CMRC ID is missing'
      );

      return;

    }

    if (this.deletingId !== null) {
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

          console.log(
            'CMRC Deleted. ID:',
            id
          );

          alert(
            'CMRC deleted successfully'
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

          if (error.status === 0) {

            alert(
              'Backend server is not reachable'
            );

          } else if (error.status === 404) {

            alert(
              'CMRC record not found'
            );

          } else if (error.status === 409) {

            alert(
              'This CMRC is linked to other records and cannot be deleted'
            );

          } else {

            alert(
              'CMRC delete failed. Please check the backend API.'
            );

          }

        }

      });

  }


  // =========================================================
  // FILTERED CMRC LIST
  // =========================================================

  get filteredCmrcList(): Cmrc[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {

      return this.cmrcList;

    }

    return this.cmrcList.filter(
      (cmrc: Cmrc) => {

        return (

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
    );

  }


  // =========================================================
  // TOTAL CMRC COUNT
  // =========================================================

  get totalCmrc(): number {

    return this.cmrcList.length;

  }


  // =========================================================
  // TOTAL CMRC AMOUNT
  // =========================================================

  get totalCmrcAmount(): number {

    return this.cmrcList.reduce(

      (
        total: number,
        cmrc: Cmrc
      ) => {

        return total +
          Number(
            cmrc.totalFund || 0
          );

      },

      0

    );

  }


  // =========================================================
  // TOTAL CMRC AMOUNT IN WORDS
  // =========================================================

  get totalCmrcAmountInWords(): string {

    if (
      this.totalCmrcAmount <= 0
    ) {

      return '';

    }

    return this.numberToWordsIndian(
      this.totalCmrcAmount
    );

  }


  // =========================================================
  // LIVE FORM AMOUNT IN WORDS
  // =========================================================

  get amountInWords(): string {

    const amount =
      Number(
        this.newCmrc.totalFund || 0
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


  // =========================================================
  // NUMBER TO INDIAN WORDS
  // =========================================================

  private numberToWordsIndian(
    num: number
  ): string {

    if (!num || num <= 0) {

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

    const twoDigitWords = (
      n: number
    ): string => {

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

    const convertBelowThousand = (
      n: number
    ): string => {

      let result = '';

      if (n >= 100) {

        result +=
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

        result +=
          twoDigitWords(n);

      }

      return result;

    };

    let result = '';

    if (num >= 10000000) {

      const crore =
        Math.floor(
          num / 10000000
        );

      result +=
        convertBelowThousand(crore) +
        ' Crore';

      num =
        num % 10000000;

      if (num > 0) {

        result += ' ';

      }

    }

    if (num >= 100000) {

      const lakh =
        Math.floor(
          num / 100000
        );

      result +=
        convertBelowThousand(lakh) +
        ' Lakh';

      num =
        num % 100000;

      if (num > 0) {

        result += ' ';

      }

    }

    if (num >= 1000) {

      const thousand =
        Math.floor(
          num / 1000
        );

      result +=
        convertBelowThousand(thousand) +
        ' Thousand';

      num =
        num % 1000;

      if (num > 0) {

        result += ' ';

      }

    }

    if (num > 0) {

      result +=
        convertBelowThousand(num);

    }

    return (
      result.trim() +
      ' Rupees Only'
    );

  }

}