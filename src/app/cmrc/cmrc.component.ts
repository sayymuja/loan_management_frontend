import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmrcService, Cmrc } from '../services/cmrc.service';
import { CmrcBalance, CmrcBalanceService } from '../services/cmrc-balance.service';

@Component({
  selector: 'app-cmrc',
  templateUrl: './cmrc.component.html',
  styleUrls: ['./cmrc.component.css']
})
export class CmrcComponent implements OnInit {

  cmrcList: Cmrc[] = [];

  showForm = false;
  isEditMode = false;
  showBalance = false;
  selectedCmrc: Cmrc | null = null;
balanceList: CmrcBalance[] = [];

balanceDate = '';
balanceAmount: number | null = null;
  newCmrc: Cmrc = {};
  searchText = '';

  constructor(private cmrcService: CmrcService,   private cmrcBalanceService: CmrcBalanceService) {}

  ngOnInit(): void {
    this.loadCmrc();
  }

  loadCmrc(): void {
    this.cmrcService.getAll().subscribe({
      next: (data) => {
        this.cmrcList = data;
        console.log('CMRC Data:', data);
      },
      error: (error) => {
        console.error('CMRC API Error:', error);
      }
    });
  }

  openAddForm(): void {
    this.newCmrc = {};
    this.isEditMode = false;
    this.showForm = true;
  }

  openEditForm(cmrc: Cmrc): void {
    this.newCmrc = { ...cmrc };
    this.isEditMode = true;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.newCmrc = {};
  }

  saveCmrc(): void {

    if (this.isEditMode && this.newCmrc.id) {

      this.cmrcService
        .update(this.newCmrc.id, this.newCmrc)
        .subscribe({
          next: () => {
            this.closeForm();
            this.loadCmrc();
          },
          error: (error) => {
            console.error('Update CMRC Error:', error);
          }
        });

    } else {

      this.cmrcService
        .create(this.newCmrc)
        .subscribe({
          next: () => {
            this.closeForm();
            this.loadCmrc();
          },
          error: (error) => {
            console.error('Create CMRC Error:', error);
          }
        });

    }
  }

  deleteCmrc(id: number): void {

    if (!confirm('Are you sure you want to delete this CMRC?')) {
      return;
    }

    this.cmrcService.delete(id).subscribe({
      next: () => {
        this.loadCmrc();
      },
      error: (error) => {
        console.error('Delete CMRC Error:', error);
      }
    });
  }

openBalance(cmrc: Cmrc): void {

  this.selectedCmrc = cmrc;
  this.showBalance = true;

  this.balanceList = [];

  if (!cmrc.id) {
    return;
  }

  this.cmrcBalanceService
    .getByCmrcId(cmrc.id)
    .subscribe({
      next: (data) => {
        this.balanceList = data;
        console.log('CMRC Balance:', data);
      },
      error: (error) => {
        console.error('CMRC Balance API Error:', error);
      }
    });
}

closeBalance(): void {
  this.showBalance = false;
  this.selectedCmrc = null;
}
saveBalance(): void {

  if (!this.selectedCmrc?.id) {
    return;
  }

  if (!this.balanceDate || this.balanceAmount === null) {
    alert('Please enter date and balance amount');
    return;
  }

  const balance: CmrcBalance = {
    cmrcId: this.selectedCmrc.id,
    balanceDate: this.balanceDate,
    balanceAmount: this.balanceAmount
  };

  this.cmrcBalanceService.create(balance).subscribe({
    next: () => {

      this.balanceDate = '';
      this.balanceAmount = null;

      this.openBalance(this.selectedCmrc!);
    },

    error: (error) => {
      console.error('Save Balance Error:', error);
    }
  });
}
get filteredCmrcList(): Cmrc[] {

  if (!this.searchText.trim()) {
    return this.cmrcList;
  }

  const search = this.searchText.toLowerCase();

  return this.cmrcList.filter(cmrc =>
    (cmrc.cmrcName ?? '').toLowerCase().includes(search) ||
    (cmrc.accountNo ?? '').toLowerCase().includes(search)
  );
}
get totalCmrc(): number {
  return this.cmrcList.length;
}

get totalFund(): number {
  return this.cmrcList.reduce(
    (sum, cmrc) => sum + (cmrc.totalFund ?? 0),
    0
  );
}

get totalServiceFee(): number {
  return this.cmrcList.reduce(
    (sum, cmrc) => sum + (cmrc.serviceFeeReceived ?? 0),
    0
  );
}

get totalRecordsPrinted(): number {
  return this.cmrcList.reduce(
    (sum, cmrc) => sum + (cmrc.recordsPrinted ?? 0),
    0
  );
}

get totalRecordsDistributed(): number {
  return this.cmrcList.reduce(
    (sum, cmrc) => sum + (cmrc.recordsDistributedVillages ?? 0),
    0
  );
}
}