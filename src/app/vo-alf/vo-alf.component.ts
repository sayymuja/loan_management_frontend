import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { CmrcService, Cmrc } from '../services/cmrc.service';

@Component({
  selector: 'app-vo-alf',
  templateUrl: './vo-alf.component.html',
  styleUrls: ['./vo-alf.component.css']
})
export class VoAlfComponent implements OnInit {

  // ================================
  // CMRC
  // ================================

  cmrcList: Cmrc[] = [];
  selectedCmrcId: number | null = null;


  // ================================
  // VO / ALF
  // ================================

  voAlfList: VoAlf[] = [];

  newVoAlf: VoAlf = {
    cmrcId: 0
  };


  // ================================
  // Form State
  // ================================

  showForm = false;
  isEditMode = false;

  isLoading = false;
  isSaving = false;


  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService
  ) {}


  // ================================
  // On Init
  // ================================

  ngOnInit(): void {
    this.loadCmrc();
  }


  // ================================
  // Load CMRC
  // ================================

  loadCmrc(): void {

    this.isLoading = true;

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        this.isLoading = false;

      },

      error: (error) => {

        console.error('CMRC API Error:', error);

        this.isLoading = false;

        alert('Unable to load CMRC data.');

      }

    });
  }


  // ================================
  // Load VO / ALF By CMRC
  // ================================

  loadVoAlfByCmrc(): void {

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      this.voAlfList = [];
      this.closeForm();

      return;
    }


    this.isLoading = true;

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          console.log('VO / ALF Data:', this.voAlfList);

          this.isLoading = false;

        },

        error: (error) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.voAlfList = [];

          this.isLoading = false;

          alert('Unable to load VO / ALF data.');

        }

      });
  }


  // ================================
  // Open Add Form
  // ================================

  openAddForm(): void {

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      alert('Please select CMRC first.');

      return;
    }


    this.newVoAlf = {

      cmrcId: this.selectedCmrcId,

      villageName: '',

      voAlfName: '',

      accountNo: '',

      receivedFund: 0

    };


    this.isEditMode = false;

    this.showForm = true;
  }


  // ================================
  // Open Edit Form
  // ================================

  openEditForm(voAlf: VoAlf): void {

    this.newVoAlf = {

      ...voAlf

    };


    this.isEditMode = true;

    this.showForm = true;
  }


  // ================================
  // Close Form
  // ================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.newVoAlf = {

      cmrcId: this.selectedCmrcId ?? 0,

      villageName: '',

      voAlfName: '',

      accountNo: '',

      receivedFund: 0

    };
  }


  // ================================
  // Save / Update VO / ALF
  // ================================

  saveVoAlf(): void {

    // CMRC validation
    if (
      this.newVoAlf.cmrcId === null ||
      this.newVoAlf.cmrcId === undefined ||
      this.newVoAlf.cmrcId <= 0
    ) {

      alert('Please select CMRC.');

      return;
    }


    // VO / ALF name validation
    if (
      !this.newVoAlf.voAlfName ||
      !this.newVoAlf.voAlfName.trim()
    ) {

      alert('Please enter VO / ALF name.');

      return;
    }


    // Village validation
    if (
      !this.newVoAlf.villageName ||
      !this.newVoAlf.villageName.trim()
    ) {

      alert('Please enter village name.');

      return;
    }


    // Received fund validation
    const receivedFund =
      Number(this.newVoAlf.receivedFund || 0);


    if (receivedFund < 0) {

      alert('Received Fund cannot be negative.');

      return;
    }


    // Normalize values
    this.newVoAlf.voAlfName =
      this.newVoAlf.voAlfName.trim();

    this.newVoAlf.villageName =
      this.newVoAlf.villageName?.trim();

    this.newVoAlf.accountNo =
      this.newVoAlf.accountNo?.trim();

    this.newVoAlf.receivedFund =
      receivedFund;


    // ================================
    // Update
    // ================================

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

            alert('VO / ALF updated successfully.');

            this.closeForm();

            this.loadVoAlfByCmrc();

          },

          error: (error) => {

            console.error(
              'Update VO / ALF Error:',
              error
            );

            this.isSaving = false;

            alert('Unable to update VO / ALF.');

          }

        });

      return;
    }


    // ================================
    // Create
    // ================================

    this.isSaving = true;

    this.voAlfService
      .create(this.newVoAlf)
      .subscribe({

        next: () => {

          this.isSaving = false;

          alert('VO / ALF added successfully.');

          this.closeForm();

          this.loadVoAlfByCmrc();

        },

        error: (error) => {

          console.error(
            'Create VO / ALF Error:',
            error
          );

          this.isSaving = false;

          alert('Unable to create VO / ALF.');

        }

      });
  }


  // ================================
  // Delete VO / ALF
  // ================================

  deleteVoAlf(id: number): void {

    if (
      !confirm(
        'Are you sure you want to delete this VO / ALF?'
      )
    ) {

      return;
    }


    this.voAlfService
      .delete(id)
      .subscribe({

        next: () => {

          alert('VO / ALF deleted successfully.');

          this.loadVoAlfByCmrc();

        },

        error: (error) => {

          console.error(
            'Delete VO / ALF Error:',
            error
          );

          alert('Unable to delete VO / ALF.');

        }

      });
  }


  // ================================
  // Get Selected CMRC Name
  // ================================

  getSelectedCmrcName(): string {

    const cmrc = this.cmrcList.find(
      c => c.id === this.selectedCmrcId
    );

    return cmrc?.cmrcName || '';
  }

}