import { Component, OnInit } from '@angular/core';

import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { CmrcService } from '../services/cmrc.service';

@Component({
  selector: 'app-vo-alf',
  templateUrl: './vo-alf.component.html',
  styleUrls: ['./vo-alf.component.css']
})
export class VoAlfComponent implements OnInit {

  // =====================================================
  // USER / ROLE
  // =====================================================

  isAdmin = false;
  currentUserCmrcId: number | null = null;

  // =====================================================
  // CMRC
  // =====================================================

  cmrcList: any[] = [];
  selectedCmrcId: number | null = null;
  selectedCmrcName = '';

  // =====================================================
  // VO / ALF
  // =====================================================

  voAlfList: VoAlf[] = [];
  selectedVoAlfId: number | null = null;

  newVoAlf: VoAlf = this.createEmptyVoAlf();

  showForm = false;
  isEditMode = false;
  editingVoAlfId: number | null = null;

  // =====================================================
  // SEARCH / STATUS
  // =====================================================

  searchText = '';

  isLoading = false;
  isSaving = false;
  isDeleting = false;

  errorMessage = '';
  successMessage = '';

  // =====================================================
  // VILLAGE LIST
  // =====================================================

  villages: string[] = [
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
  ];

  constructor(
    private voAlfService: VoAlfService,
    private cmrcService: CmrcService
  ) {}

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCmrcList();
  }

  // =====================================================
  // CURRENT USER
  // =====================================================

  loadCurrentUser(): void {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        this.isAdmin = false;
        this.currentUserCmrcId = null;
        return;
      }

      const user = JSON.parse(storedUser);

      const role = String(
        user.role || localStorage.getItem('role') || ''
      ).toUpperCase();

      this.isAdmin =
        role === 'ADMIN' ||
        role === 'SUPER_ADMIN';

      const cmrcId = Number(user.cmrcId);

      this.currentUserCmrcId =
        Number.isFinite(cmrcId) && cmrcId > 0
          ? cmrcId
          : null;

    } catch (error) {
      console.error('Unable to read current user:', error);

      this.isAdmin = false;
      this.currentUserCmrcId = null;
    }
  }

  // =====================================================
  // LOAD CMRC LIST
  // =====================================================

  loadCmrcList(): void {
    this.errorMessage = '';

    this.cmrcService.getAll().subscribe({
      next: (response: any[]) => {
        this.cmrcList = response || [];

        if (this.isAdmin) {
          if (this.cmrcList.length > 0) {
            const exists = this.cmrcList.some(
              cmrc => Number(cmrc.id) === Number(this.selectedCmrcId)
            );

            if (!exists) {
              this.selectedCmrcId = Number(this.cmrcList[0].id);
            }

            this.updateSelectedCmrcDetails();
            this.loadVoAlfByCmrc();
          } else {
            this.selectedCmrcId = null;
            this.selectedCmrcName = '';
            this.voAlfList = [];
          }

          return;
        }

        // Non-admin users can access their assigned CMRC.
        if (this.currentUserCmrcId !== null) {
          const assignedCmrc = this.cmrcList.find(
            cmrc =>
              Number(cmrc.id) === Number(this.currentUserCmrcId)
          );

          this.selectedCmrcId = this.currentUserCmrcId;

          this.selectedCmrcName =
            assignedCmrc?.cmrcName || '';

          this.loadVoAlfByCmrc();
        } else {
          this.selectedCmrcId = null;
          this.selectedCmrcName = '';
          this.voAlfList = [];
          this.errorMessage =
            'No CMRC is assigned to the current user.';
        }
      },

      error: (error: any) => {
        console.error('Error loading CMRC list:', error);

        this.cmrcList = [];
        this.errorMessage = 'Unable to load CMRC records.';
      }
    });
  }

  // =====================================================
  // CMRC CHANGE
  // =====================================================

  onCmrcChange(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.closeForm();
    this.searchText = '';
    this.selectedVoAlfId = null;

    this.updateSelectedCmrcDetails();
    this.loadVoAlfByCmrc();
  }

  updateSelectedCmrcDetails(): void {
    const selectedCmrc = this.cmrcList.find(
      cmrc => Number(cmrc.id) === Number(this.selectedCmrcId)
    );

    this.selectedCmrcName =
      selectedCmrc?.cmrcName || '';
  }

  // =====================================================
  // LOAD VO / ALF RECORDS
  // =====================================================

  loadVoAlfByCmrc(): void {
    if (!this.selectedCmrcId) {
      this.voAlfList = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    this.voAlfService
      .getByCmrcId(Number(this.selectedCmrcId))
      .subscribe({
        next: (response: VoAlf[]) => {
          this.voAlfList = response || [];

          // Keep the selected record only if it still exists.
          if (
            this.selectedVoAlfId !== null &&
            !this.voAlfList.some(
              item => Number(item.id) ===
                Number(this.selectedVoAlfId)
            )
          ) {
            this.selectedVoAlfId = null;
          }

          this.isLoading = false;
        },

        error: (error: any) => {
          console.error('Error loading VO / ALF:', error);

          this.voAlfList = [];
          this.isLoading = false;
          this.errorMessage =
            'Unable to load VO / ALF records.';
        }
      });
  }

  // =====================================================
  // VO / ALF FILTER
  // =====================================================

  onVoAlfChange(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  get selectedVoAlfRecords(): VoAlf[] {
    if (this.selectedVoAlfId === null) {
      return this.voAlfList;
    }

    return this.voAlfList.filter(
      item =>
        Number(item.id) === Number(this.selectedVoAlfId)
    );
  }

  get filteredVoAlfList(): VoAlf[] {
    const search = this.searchText
      .trim()
      .toLowerCase();

    if (!search) {
      return this.selectedVoAlfRecords;
    }

  return this.selectedVoAlfRecords.filter(item => {
  return [
    item.voAlfName,
    item.villageName,
    item.accountNo
  ].some(value =>
    String(value ?? '').toLowerCase().includes(search)
  );
});
  }

  // =====================================================
  // SUMMARY
  // =====================================================

  get totalVoAlf(): number {
    return this.selectedVoAlfRecords.length;
  }

  get totalVillages(): number {
    return new Set(
      this.selectedVoAlfRecords
        .map(item => String(item.villageName || '').trim())
        .filter(village => village.length > 0)
    ).size;
  }

  get totalRecordedFunds(): number {
    return this.selectedVoAlfRecords.reduce(
      (total, item) =>
        total + this.toAmount(item.receivedFund),
      0
    );
  }

  get voAlfTotalBalance(): number {
    return this.totalRecordedFunds;
  }

  // =====================================================
  // ACCOUNT NUMBER LOCK
  // =====================================================

  get isAccountNumberLocked(): boolean {
    return (
      this.isEditMode &&
      this.toAmount(this.newVoAlf.receivedFund) > 0
    );
  }

  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  openAddForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedCmrcId) {
      this.errorMessage = 'Please select a CMRC first.';
      return;
    }

    this.isEditMode = false;
    this.editingVoAlfId = null;

    this.newVoAlf = this.createEmptyVoAlf();
    this.newVoAlf.cmrcId = Number(this.selectedCmrcId);

    this.showForm = true;
  }

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(item: VoAlf): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.isEditMode = true;
    this.editingVoAlfId = Number(item.id);

    // Copy the selected record into the form.
    // Do not directly mutate the table record.
   this.newVoAlf = {
  id: item.id,
  cmrcId: Number(item.cmrcId),
  voAlfName: item.voAlfName || '',
  villageName: item.villageName || '',
  accountNo: item.accountNo || '',
  receivedFund: this.toAmount(item.receivedFund)
};

    this.showForm = true;
  }

  // =====================================================
  // SAVE / UPDATE VO / ALF
  // =====================================================

  saveVoAlf(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isSaving) {
      return;
    }

    if (!this.selectedCmrcId) {
      this.errorMessage = 'Please select a CMRC.';
      return;
    }

    const voAlfName = String(
      this.newVoAlf.voAlfName || ''
    ).trim();

    const villageName = String(
      this.newVoAlf.villageName || ''
    ).trim();

    const accountNo = String(
      this.newVoAlf.accountNo || ''
    ).trim();

    if (!voAlfName) {
      this.errorMessage = 'Please enter the VO / ALF name.';
      return;
    }

    if (!villageName) {
      this.errorMessage = 'Please select a village.';
      return;
    }

    if (!accountNo) {
      this.errorMessage = 'Please enter the account number.';
      return;
    }

    const wasEditMode = this.isEditMode;
    const currentId = this.editingVoAlfId;

    const existingRecord = wasEditMode
      ? this.voAlfList.find(
          item => Number(item.id) === Number(currentId)
        )
      : undefined;

    if (wasEditMode && !existingRecord) {
      this.errorMessage =
        'The selected VO / ALF record could not be found.';
      return;
    }

    // Protect the existing account number in the UI logic
    // when a balance has already been recorded.
    if (
      wasEditMode &&
      existingRecord &&
      this.toAmount(existingRecord.receivedFund) > 0
    ) {
      this.newVoAlf.accountNo =
        existingRecord.accountNo || '';
    }

    const payload: VoAlf = {
  id: wasEditMode ? currentId ?? undefined : undefined,
  cmrcId: Number(this.selectedCmrcId),
  voAlfName,
  villageName,
  accountNo: String(this.newVoAlf.accountNo || '').trim(),
  receivedFund: wasEditMode && existingRecord
    ? this.toAmount(existingRecord.receivedFund)
    : 0
};

    this.isSaving = true;

    const request = wasEditMode && currentId !== null
      ? this.voAlfService.update(currentId, payload)
      : this.voAlfService.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;

        this.showForm = false;
        this.isEditMode = false;
        this.editingVoAlfId = null;
        this.newVoAlf = this.createEmptyVoAlf();

        this.searchText = '';
        this.selectedVoAlfId = null;

        this.successMessage = wasEditMode
          ? 'VO / ALF updated successfully.'
          : 'VO / ALF added successfully.';

        // Reload from backend so the table and summary
        // show the saved values rather than stale data.
        this.loadVoAlfByCmrc();
      },

      error: (error: any) => {
        console.error('Error saving VO / ALF:', error);

        this.isSaving = false;

        this.errorMessage =
          error?.error?.message ||
          error?.error ||
          (wasEditMode
            ? 'Unable to update VO / ALF.'
            : 'Unable to add VO / ALF.');
      }
    });
  }

  // =====================================================
  // DELETE VO / ALF
  // =====================================================

  deleteVoAlf(id: number | undefined): void {
    if (!id || this.isDeleting) {
      return;
    }

    const item = this.voAlfList.find(
      record => Number(record.id) === Number(id)
    );

    if (!item) {
      this.errorMessage = 'VO / ALF record not found.';
      return;
    }

    if (!confirm(
      `Are you sure you want to delete "${item.voAlfName}"?`
    )) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isDeleting = true;

    this.voAlfService.delete(id).subscribe({
      next: () => {
        this.isDeleting = false;

        this.successMessage =
          'VO / ALF deleted successfully.';

        if (Number(this.selectedVoAlfId) === Number(id)) {
          this.selectedVoAlfId = null;
        }

        this.loadVoAlfByCmrc();
      },

      error: (error: any) => {
        console.error('Error deleting VO / ALF:', error);

        this.isDeleting = false;

        this.errorMessage =
          error?.error?.message ||
          error?.error ||
          'Unable to delete VO / ALF.';
      }
    });
  }

  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingVoAlfId = null;
    this.newVoAlf = this.createEmptyVoAlf();
  }

  // =====================================================
  // REFRESH
  // =====================================================

  refreshVoAlf(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.loadCmrcList();
  }

  // =====================================================
  // CREATE EMPTY MODEL
  // =====================================================

  createEmptyVoAlf(): VoAlf {
  return {
    cmrcId: Number(this.selectedCmrcId || 0),
    voAlfName: '',
    villageName: '',
    accountNo: '',
    receivedFund: 0
  };
}
  // =====================================================
  // HELPERS
  // =====================================================

  toAmount(value: unknown): number {
    const amount = Number(value || 0);

    return Number.isFinite(amount) ? amount : 0;
  }

  formatCurrency(value: unknown): string {
    return this.toAmount(value).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    });
  }
}
