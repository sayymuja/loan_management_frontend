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

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  showForm = false;
  isEditMode = false;
  selectedCmrcName: any;

newVoAlf: VoAlf = {
  cmrcId: 0
};

  selectedCmrcId: number | null = null;

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService
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

    if (!this.selectedCmrcId) {
      this.voAlfList = [];
      return;
    }

    this.voAlfService.getByCmrcId(this.selectedCmrcId).subscribe({
      next: (data) => {
        this.voAlfList = data;
        console.log('VO/ALF Data:', data);
      },
      error: (error) => {
        console.error('VO/ALF API Error:', error);
      }
    });
  }
  openAddForm(): void {

  if (!this.selectedCmrcId) {
    alert('Please select CMRC first');
    return;
  }

  this.newVoAlf = {
    cmrcId: this.selectedCmrcId
  };

  this.isEditMode = false;
  this.showForm = true;
}

closeForm(): void {
  this.showForm = false;

  this.newVoAlf = {
    cmrcId: this.selectedCmrcId ?? 0
  };
}

saveVoAlf(): void {

  if (!this.newVoAlf.voAlfName) {
    alert('Please enter VO / ALF name');
    return;
  }

  if (this.isEditMode && this.newVoAlf.id) {

    this.voAlfService.update(
      this.newVoAlf.id,
      this.newVoAlf
    ).subscribe({
      next: () => {
        this.closeForm();
        this.loadVoAlfByCmrc();
      },
      error: (error) => {
        console.error('Update VO/ALF Error:', error);
      }
    });

  } else {

    this.voAlfService.create(this.newVoAlf).subscribe({
      next: () => {
        this.closeForm();
        this.loadVoAlfByCmrc();
      },
      error: (error) => {
        console.error('Create VO/ALF Error:', error);
      }
    });

  }
}
getSelectedCmrcName(): string {
  const cmrc = this.cmrcList.find(
    c => c.id === this.selectedCmrcId
  );

  return cmrc?.cmrcName || '';
}
openEditForm(voAlf: VoAlf): void {
  this.newVoAlf = { ...voAlf };
  this.isEditMode = true;
  this.showForm = true;
}

deleteVoAlf(id: number): void {

  if (!confirm('Are you sure you want to delete this VO / ALF?')) {
    return;
  }

  this.voAlfService.delete(id).subscribe({
    next: () => {
      this.loadVoAlfByCmrc();
    },
    error: (error) => {
      console.error('Delete VO/ALF Error:', error);
    }
  });
}
}