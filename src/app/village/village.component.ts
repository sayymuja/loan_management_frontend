import { Component, OnInit } from '@angular/core';

import { VillageService, Village } from '../services/village.service';

import { VoAlfService, VoAlf } from '../services/vo-alf.service';

import { CmrcService, Cmrc } from '../services/cmrc.service';


@Component({
  selector: 'app-village',
  templateUrl: './village.component.html',
  styleUrls: ['./village.component.css']
})
export class VillageComponent implements OnInit {

  // =====================================================
  // CMRC
  // =====================================================

  cmrcList: Cmrc[] = [];

  selectedCmrcId: number | null = null;


  // =====================================================
  // VO / ALF
  // =====================================================

  voAlfList: VoAlf[] = [];

  selectedVoAlfId: number | null = null;


  // =====================================================
  // VILLAGE
  // =====================================================

  villageList: Village[] = [];

  searchText = '';


  // =====================================================
  // FORM
  // =====================================================

  showForm = false;

  isEditMode = false;

  isSaving = false;

  deletingId: number | null = null;


  newVillage: Village = {
    voAlfId: 0,
    villageName: ''
  };


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private villageService: VillageService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadCmrc();

  }


  // =====================================================
  // LOAD CMRC
  // =====================================================

  loadCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data;

        console.log('CMRC List:', data);

      },

      error: (error: any) => {

        console.error('CMRC API Error:', error);

        alert('Unable to load CMRC records');

      }

    });

  }


  // =====================================================
  // CMRC CHANGE
  // =====================================================

  onCmrcChange(): void {

    // Reset VO / ALF
    this.selectedVoAlfId = null;

    this.voAlfList = [];

    // Reset Village
    this.villageList = [];

    this.searchText = '';

    // Close form
    this.closeForm();

    // No CMRC selected
    if (this.selectedCmrcId == null) {

      return;

    }


    // Load VO / ALF under selected CMRC
    this.loadVoAlfByCmrc(this.selectedCmrcId);

  }


  // =====================================================
  // LOAD VO / ALF BY CMRC
  // =====================================================

  loadVoAlfByCmrc(cmrcId: number): void {

    this.voAlfService.getByCmrcId(cmrcId).subscribe({

      next: (data: VoAlf[]) => {

        this.voAlfList = data;

        console.log('VO / ALF List:', data);

      },

      error: (error: any) => {

        console.error('VO / ALF API Error:', error);

        alert('Unable to load VO / ALF records');

      }

    });

  }


  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    this.villageList = [];

    this.searchText = '';

    this.closeForm();


    if (this.selectedVoAlfId == null) {

      return;

    }


    // Load villages under selected VO / ALF
    this.loadVillagesByVoAlf(this.selectedVoAlfId);

  }


  // =====================================================
  // LOAD VILLAGES
  // =====================================================

  loadVillagesByVoAlf(voAlfId: number): void {

    this.villageService.getByVoAlfId(voAlfId).subscribe({

      next: (data: Village[]) => {

        this.villageList = data;

        console.log('Village List:', data);

      },

      error: (error: any) => {

        console.error('Village API Error:', error);

        alert('Unable to load villages');

      }

    });

  }


  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  openAddForm(): void {

    if (this.selectedVoAlfId == null) {

      alert('Please select CMRC and VO / ALF first');

      return;

    }


    this.newVillage = {

      voAlfId: this.selectedVoAlfId,

      villageName: ''

    };


    this.isEditMode = false;

    this.showForm = true;

  }


  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(village: Village): void {

    this.newVillage = {

      id: village.id,

      voAlfId: village.voAlfId,

      villageName: village.villageName || ''

    };


    this.isEditMode = true;

    this.showForm = true;

  }


  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.isSaving = false;


    this.newVillage = {

      voAlfId: this.selectedVoAlfId || 0,

      villageName: ''

    };

  }


  // =====================================================
  // SAVE / UPDATE VILLAGE
  // =====================================================

  saveVillage(): void {

    // ---------------------------------------------
    // Validate VO / ALF
    // ---------------------------------------------

    if (
      this.newVillage.voAlfId == null ||
      this.newVillage.voAlfId === 0
    ) {

      alert('Please select VO / ALF');

      return;

    }


    // ---------------------------------------------
    // Validate Village Name
    // ---------------------------------------------

    if (!this.newVillage.villageName?.trim()) {

      alert('Please enter village name');

      return;

    }


    // ---------------------------------------------
    // Prevent double click
    // ---------------------------------------------

    if (this.isSaving) {

      return;

    }


    this.isSaving = true;


    // =================================================
    // UPDATE
    // =================================================

    if (this.isEditMode) {

      if (this.newVillage.id == null) {

        alert('Village ID is missing');

        this.isSaving = false;

        return;

      }


      const id = this.newVillage.id;


      this.villageService.update(
        id,
        this.newVillage
      ).subscribe({

        next: (response: Village) => {

          console.log('Village Updated:', response);

          alert('Village updated successfully');

          this.closeForm();

          this.loadVillagesByVoAlf(
            this.selectedVoAlfId!
          );

        },

        error: (error: any) => {

          console.error(
            'Update Village Error:',
            error
          );

          alert('Village update failed');

          this.isSaving = false;

        }

      });


      return;

    }


    // =================================================
    // CREATE
    // =================================================

    this.villageService.create(
      this.newVillage
    ).subscribe({

      next: (response: Village) => {

        console.log('Village Created:', response);

        alert('Village added successfully');

        this.closeForm();

        this.loadVillagesByVoAlf(
          this.selectedVoAlfId!
        );

      },

      error: (error: any) => {

        console.error(
          'Create Village Error:',
          error
        );

        alert('Village creation failed');

        this.isSaving = false;

      }

    });

  }


  // =====================================================
  // DELETE VILLAGE
  // =====================================================

  deleteVillage(id: number | undefined): void {

    if (id == null) {

      alert('Village ID is missing');

      return;

    }


    if (this.deletingId !== null) {

      return;

    }


    const confirmed = confirm(
      'Are you sure you want to delete this village?'
    );


    if (!confirmed) {

      return;

    }


    this.deletingId = id;


    this.villageService.delete(id).subscribe({

      next: () => {

        console.log(
          'Village Deleted. ID:',
          id
        );

        alert('Village deleted successfully');

        this.deletingId = null;


        if (this.selectedVoAlfId != null) {

          this.loadVillagesByVoAlf(
            this.selectedVoAlfId
          );

        }

      },

      error: (error: any) => {

        console.error(
          'Delete Village Error:',
          error
        );

        this.deletingId = null;


        if (error.status === 409) {

          alert(
            'This village is linked to other records and cannot be deleted'
          );

        } else {

          alert('Village delete failed');

        }

      }

    });

  }


  // =====================================================
  // FILTER VILLAGES
  // =====================================================

  get filteredVillageList(): Village[] {

    const search =
      this.searchText.trim().toLowerCase();


    if (!search) {

      return this.villageList;

    }


    return this.villageList.filter(
      village =>
        (village.villageName || '')
          .toLowerCase()
          .includes(search)
    );

  }


  // =====================================================
  // TOTAL VILLAGES
  // =====================================================

  get totalVillages(): number {

    return this.villageList.length;

  }


  // =====================================================
  // SELECTED CMRC NAME
  // =====================================================

  get selectedCmrcName(): string {

    const selected = this.cmrcList.find(
      cmrc => cmrc.id === this.selectedCmrcId
    );


    return selected?.cmrcName || '-';

  }


  // =====================================================
  // SELECTED VO / ALF NAME
  // =====================================================

  get selectedVoAlfName(): string {

    const selected = this.voAlfList.find(
      voAlf => voAlf.id === this.selectedVoAlfId
    );


    return selected?.voAlfName || '-';

  }

}