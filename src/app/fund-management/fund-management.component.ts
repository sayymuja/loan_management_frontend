import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import {
  VoAlfFundService,
  VoAlfFund
} from '../services/vo-alf-fund.service';

@Component({
  selector: 'app-fund-management',
  templateUrl: './fund-management.component.html',
  styleUrls: ['./fund-management.component.css']
})
export class FundManagementComponent implements OnInit {

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  fundList: VoAlfFund[] = [];

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;
  showForm = false;
isEditMode = false;

newFund: VoAlfFund = {
  voAlfId: 0
};

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private voAlfFundService: VoAlfFundService
  ) {}

  ngOnInit(): void {
    this.loadCmrc();
  }

  loadCmrc(): void {
    this.cmrcService.getAll().subscribe({
      next: (data) => {
        this.cmrcList = data;
      },
      error: (error) => {
        console.error('CMRC API Error:', error);
      }
    });
  }

  loadVoAlfByCmrc(): void {

    this.voAlfList = [];
    this.fundList = [];
    this.selectedVoAlfId = null;

    if (!this.selectedCmrcId) {
      return;
    }

    this.voAlfService.getByCmrcId(this.selectedCmrcId).subscribe({
      next: (data) => {
        this.voAlfList = data;
      },
      error: (error) => {
        console.error('VO/ALF API Error:', error);
      }
    });
  }

 loadFund(): void {
  this.fundList = [];

  if (!this.selectedVoAlfId) {
    return;
  }

  this.voAlfFundService.getByVoAlfId(this.selectedVoAlfId).subscribe({
    next: (fund) => {
      this.fundList = [fund];

      // Existing fund mila → Edit mode
      this.newFund = { ...fund };
      this.isEditMode = true;

      console.log('Existing Fund:', fund);
    },

    error: (error) => {
      // Fund nahi mila → Add mode
      if (error.status === 404) {
        this.newFund = {
          voAlfId: this.selectedVoAlfId!
        };

        this.isEditMode = false;

        console.log('No Fund found → Add mode');
      } else {
        console.error('Fund API Error:', error);
      }
    }
  });
}

  getSelectedCmrcName(): string {

    const cmrc = this.cmrcList.find(
      c => c.id === this.selectedCmrcId
    );

    return cmrc?.cmrcName || '';
  }

  getSelectedVoAlfName(): string {

    const voAlf = this.voAlfList.find(
      v => v.id === this.selectedVoAlfId
    );

    return voAlf?.voAlfName || '';
  }
   getSelectedVoAlfRecievedFund(): number | string {

    const voAlf = this.voAlfList.find(
      v => v.id === this.selectedVoAlfId
    );

    return voAlf?.receivedFund || '';
  }
openAddForm(): void {
  if (!this.selectedVoAlfId) {
    alert('Please select VO / ALF first');
    return;
  }

  // Existing fund hai → Edit mode
  if (this.fundList.length > 0) {
    this.newFund = { ...this.fundList[0] };
    this.isEditMode = true;
  } 
  // Fund nahi hai → Add mode
  else {
    this.newFund = {
      voAlfId: this.selectedVoAlfId
    };
    this.isEditMode = false;
  }

  this.showForm = true;
}
closeForm(): void {

  this.showForm = false;

  this.newFund = {
    voAlfId: this.selectedVoAlfId ?? 0
  };
}
saveFund(): void {

  if (!this.selectedVoAlfId) {
    alert('Please select VO / ALF first');
    return;
  }

  this.newFund.voAlfId = this.selectedVoAlfId;

  if (this.isEditMode && this.newFund.id) {

    this.voAlfFundService.update(
      this.newFund.id,
      this.newFund
    ).subscribe({
      next: () => {
        this.closeForm();
        this.loadFund();
      },
      error: (error) => {
        console.error('Update Fund Error:', error);
      }
    });

  } else {

    this.voAlfFundService.create(this.newFund).subscribe({
      next: () => {
        this.closeForm();
        this.loadFund();
      },
      error: (error) => {
        console.error('Create Fund Error:', error);
      }
    });

  }
}
openEditForm(fund: VoAlfFund): void {

  this.newFund = { ...fund };

  this.isEditMode = true;
  this.showForm = true;
}
deleteFund(id: number): void {

  if (!confirm('Are you sure you want to delete this fund record?')) {
    return;
  }

  this.voAlfFundService.delete(id).subscribe({
    next: () => {
      this.loadFund();
    },
    error: (error) => {
      console.error('Delete Fund Error:', error);
    }
  });
}
}