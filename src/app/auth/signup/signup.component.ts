import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  name = '';
  email = '';
  password = '';
  cmrcName = '';

  // =========================================================
  // LOCATION
  // =========================================================

  district = '';
  taluka = '';

  selectedTalukas: string[] = [];

  // =========================================================
  // MAHARASHTRA DISTRICT -> TALUKA
  // =========================================================

  districtTalukaMap: { [key: string]: string[] } = {

    'Ahmednagar': [
      'Nagar',
      'Newasa',
      'Karjat',
      'Jamkhed',
      'Pathardi',
      'Shevgaon',
      'Shrigonda',
      'Parner',
      'Sangamner',
      'Akole',
      'Rahata',
      'Kopargaon',
      'Shrirampur',
      'Rahuri'
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
      'Amravati',
      'Achalpur',
      'Anjangaon Surji',
      'Bhatkuli',
      'Chandur Bz',
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
      'Gangapur',
      'Kannad',
      'Khuldabad',
      'Paithan',
      'Phulambri',
      'Sillod',
      'Soegaon',
      'Vaijapur'
    ],

    'Beed': [
      'Beed',
      'Ashti',
      'Dharur',
      'Georai',
      'Kaij',
      'Manjlegaon',
      'Parli',
      'Patoda',
      'Shirur Kasar',
      'Wadwani'
    ],

    'Bhandara': [
      'Bhandara',
      'Lakhani',
      'Lakhandur',
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
      'Chandrapur',
      'Ballarpur',
      'Bhadravati',
      'Brahmapuri',
      'Chimur',
      'Gondpipri',
      'Jiwati',
      'Korpana',
      'Mul',
      'Nagbhir',
      'Pombhurna',
      'Rajura',
      'Saoli',
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
      'Gadchiroli',
      'Aheri',
      'Armori',
      'Bhamragad',
      'Chamorshi',
      'Dhanora',
      'Desaiganj',
      'Etapalli',
      'Kurkheda',
      'Korchi',
      'Mulchera',
      'Sironcha'
    ],

    'Gondia': [
      'Gondia',
      'Amgaon',
      'Arjuni Morgaon',
      'Deori',
      'Goregaon',
      'Sadak Arjuni',
      'Salekasa',
      'Tirora'
    ],

    'Hingoli': [
      'Hingoli',
      'Basmath',
      'Kalamnuri',
      'Sengaon',
      'Aundha Nagnath'
    ],

    'Jalgaon': [
      'Jalgaon',
      'Amalner',
      'Bhadgaon',
      'Bhusawal',
      'Bodwad',
      'Chalisgaon',
      'Chopda',
      'Dharangaon',
      'Erandol',
      'Jalgaon Jamod',
      'Jamner',
      'Muktainagar',
      'Pachora',
      'Parola',
      'Raver',
      'Yawal'
    ],

    'Jalna': [
      'Jalna',
      'Ambad',
      'Badnapur',
      'Bhokardan',
      'Ghansawangi',
      'Jafrabad',
      'Mantha',
      'Partur'
    ],

    'Kolhapur': [
      'Karvir',
      'Panhala',
      'Shahuwadi',
      'Kagal',
      'Hatkanangale',
      'Shirol',
      'Radhanagari',
      'Bhudargad',
      'Ajra',
      'Chandgad',
      'Gaganbawada'
    ],

    'Latur': [
      'Latur',
      'Ausa',
      'Chakur',
      'Deoni',
      'Jalkot',
      'Nilanga',
      'Renapur',
      'Shirur Anantpal',
      'Udgir',
      'Ahmedpur'
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
      'Nagpur Urban',
      'Nagpur Rural',
      'Hingna',
      'Kamptee',
      'Katol',
      'Kuhi',
      'Mouda',
      'Narkhed',
      'Parseoni',
      'Ramtek',
      'Saoner',
      'Umred'
    ],

    'Nanded': [
      'Nanded',
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
      'Naigaon'
    ],

    'Nandurbar': [
      'Nandurbar',
      'Akkalkuwa',
      'Akrani',
      'Navapur',
      'Shahada',
      'Taloda'
    ],

    'Nashik': [
      'Nashik',
      'Baglan',
      'Chandwad',
      'Deola',
      'Dindori',
      'Igatpuri',
      'Kalwan',
      'Malegaon',
      'Nandgaon',
      'Niphad',
      'Peint',
      'Sinnar',
      'Surgana',
      'Trimbakeshwar',
      'Yeola'
    ],

    'Osmanabad': [
      'Osmanabad',
      'Bhoom',
      'Kalamb',
      'Lohara',
      'Paranda',
      'Tuljapur',
      'Umarga',
      'Washi'
    ],

    'Palghar': [
      'Palghar',
      'Dahanu',
      'Jawhar',
      'Mokhada',
      'Talasari',
      'Vasai',
      'Vikramgad',
      'Wada'
    ],

    'Parbhani': [
      'Parbhani',
      'Gangakhed',
      'Jintur',
      'Manwath',
      'Manwat',
      'Palam',
      'Pathri',
      'Purna',
      'Sonpeth'
    ],

    'Pune': [
      'Pune City',
      'Haveli',
      'Khed',
      'Ambegaon',
      'Junnar',
      'Daund',
      'Indapur',
      'Baramati',
      'Purandar',
      'Shirur',
      'Bhor',
      'Velhe',
      'Mulshi',
      'Maval'
    ],

    'Raigad': [
      'Alibag',
      'Murud',
      'Panvel',
      'Uran',
      'Karjat',
      'Khalapur',
      'Mangaon',
      'Tala',
      'Roha',
      'Sudhagad',
      'Mahad',
      'Poladpur',
      'Shrivardhan',
      'Mhasla'
    ],

    'Ratnagiri': [
      'Ratnagiri',
      'Sangameshwar',
      'Lanja',
      'Rajapur',
      'Chiplun',
      'Guhagar',
      'Dapoli',
      'Mandangad',
      'Khed'
    ],

    'Sangli': [
      'Sangli',
      'Miraj',
      'Jat',
      'Kadegaon',
      'Kavathe Mahankal',
      'Khanapur',
      'Palus',
      'Shirala',
      'Tasgaon',
      'Walwa'
    ],

    'Satara': [
      'Satara',
      'Karad',
      'Khatav',
      'Koregaon',
      'Mahabaleshwar',
      'Man',
      'Patan',
      'Phaltan',
      'Wai',
      'Jaoli'
    ],

    'Sindhudurg': [
      'Devgad',
      'Vaibhavwadi',
      'Kankavli',
      'Malvan',
      'Sawantwadi',
      'Vengurla',
      'Kudal',
      'Dodamarg'
    ],

    'Solapur': [
      'Solapur North',
      'Solapur South',
      'Akkalkot',
      'Barshi',
      'Karmala',
      'Madha',
      'Malshiras',
      'Mangalvedhe',
      'Mohol',
      'Pandharpur',
      'Sangole'
    ],

    'Thane': [
      'Thane',
      'Bhiwandi',
      'Kalyan',
      'Murbad',
      'Shahapur',
      'Ulhasnagar',
      'Ambernath'
    ],

    'Wardha': [
      'Wardha',
      'Arvi',
      'Ashti',
      'Deoli',
      'Hinganghat',
      'Karanja',
      'Samudrapur',
      'Seloo'
    ],

    'Washim': [
      'Washim',
      'Malegaon',
      'Mangrulpir',
      'Manora',
      'Karanja',
      'Risod'
    ],

    'Yavatmal': [
      'Yavatmal',
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
      'Zari-Jamani'
    ]
  };

  districts: string[] = Object.keys(this.districtTalukaMap);

  // =========================================================
  // MESSAGES
  // =========================================================

  message = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  // =========================================================
  // DISTRICT CHANGE
  // =========================================================

  onDistrictChange(): void {

    this.taluka = '';

    this.selectedTalukas =
      this.districtTalukaMap[this.district] || [];
  }

  // =========================================================
  // SIGNUP
  // =========================================================

  signup() {

    this.message = '';
    this.errorMessage = '';

    const user = {
      name: this.name,
      email: this.email,
      password: this.password,
      cmrcName: this.cmrcName,
      district: this.district,
      taluka: this.taluka
    };

    this.authService.signup(user).subscribe({

      next: (response) => {

        console.log(response);

        this.message = 'Signup successful!';

        this.name = '';
        this.email = '';
        this.password = '';
        this.cmrcName = '';

        this.district = '';
        this.taluka = '';
        this.selectedTalukas = [];
      },

      error: (error) => {

        console.error(error);

        this.errorMessage =
          error.error?.message || 'Signup failed';
      }

    });
  }
}