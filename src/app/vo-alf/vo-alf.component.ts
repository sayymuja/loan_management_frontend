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
}