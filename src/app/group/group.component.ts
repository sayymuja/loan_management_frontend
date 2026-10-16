import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GroupService, Group } from '../services/group.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { CmrcService, Cmrc } from '../services/cmrc.service';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {

  // =====================================================
  // DATA LISTS
  // =====================================================

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  groups: Group[] = [];
  filteredGroupList: Group[] = [];

  // =====================================================
  // SELECTED FILTERS
  // =====================================================

  selectedCmrcId: number | null = null;
  selectedCmrcName = '';
  selectedDistrict = '';
  selectedTaluka = '';

  selectedVoAlfId: number | null = null;
  selectedVoAlfName = '';
  selectedVoAlfVillageName = '';

  // =====================================================
  // FORM
  // =====================================================

  showForm = false;
  isEditMode = false;
  isSaving = false;

  editingGroupId: number | null = null;

  newGroup: Group = {
    cmrcId: 0,
    voAlfId: 0,
    villageName: '',
    groupName: ''
  } as Group;

  // =====================================================
  // SEARCH AND STATUS
  // =====================================================

  searchText = '';

  errorMessage = '';
  successMessage = '';

  loading = false;
  deletingId: number | null = null;

  get isLoading(): boolean {
    return this.loading;
  }

  get totalGroups(): number {
    return this.filteredGroupList.length;
  }

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private groupService: GroupService,
    private voAlfService: VoAlfService,
    private cmrcService: CmrcService
  ) {}

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {
    this.loadCmrcList();
    this.loadGroups();
  }

  // =====================================================
  // LOAD CMRC LIST
  // =====================================================

 loadCmrcList(): void {
  this.cmrcService.getAll().subscribe({
    next: (data: Cmrc[]) => {
      this.cmrcList = data || [];

      if (this.cmrcList.length > 0) {
        // Select the first CMRC by default
        this.selectedCmrcId = this.cmrcList[0].id ?? null;

        this.onCmrcChange();
      } else {
        this.selectedCmrcId = null;
        this.selectedCmrcName = '';
        this.voAlfList = [];
        this.selectedVoAlfId = null;
        this.selectedVoAlfName = '';
        this.selectedVoAlfVillageName = '';
        this.applyFilters();
      }
    },
    error: () => {
      this.errorMessage = 'Unable to load CMRC list.';
    }
  });
}
  // =====================================================
  // LOAD GROUPS
  // =====================================================

  loadGroups(): void {
    this.loading = true;

    this.groupService.getAll().subscribe({
      next: (data: Group[]) => {
        this.groups = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load groups.';
      }
    });
  }

  // =====================================================
  // CMRC CHANGE
  // =====================================================

  onCmrcChange(): void {
    this.clearMessages();

    this.showForm = false;
    this.isEditMode = false;
    this.editingGroupId = null;

    this.selectedVoAlfId = null;
    this.selectedVoAlfName = '';
    this.selectedVoAlfVillageName = '';
    this.voAlfList = [];

    const selectedCmrc = this.cmrcList.find(
      item => Number(item.id) === Number(this.selectedCmrcId)
    );

    this.selectedCmrcName = selectedCmrc?.cmrcName || '';

    this.selectedDistrict = selectedCmrc?.district || '';
    this.selectedTaluka = selectedCmrc?.taluka || '';

    if (this.selectedCmrcId !== null) {
      this.loadVoAlfList(this.selectedCmrcId);
    }

    this.applyFilters();
  }

  // =====================================================
  // LOAD VO / ALF LIST
  // =====================================================

  loadVoAlfList(cmrcId: number): void {
    this.voAlfService.getAll().subscribe({
      next: (data: VoAlf[]) => {
        this.voAlfList = (data || []).filter(
          item => Number(item.cmrcId) === Number(cmrcId)
        );
      },
      error: () => {
        this.errorMessage = 'Unable to load VO / ALF list.';
      }
    });
  }

  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {
    this.clearMessages();

    this.showForm = false;
    this.isEditMode = false;
    this.editingGroupId = null;

    const selectedVoAlf = this.voAlfList.find(
      item => Number(item.id) === Number(this.selectedVoAlfId)
    );

    this.selectedVoAlfName = selectedVoAlf?.voAlfName || '';
    this.selectedVoAlfVillageName =
      selectedVoAlf?.villageName || '';

    this.applyFilters();
  }

  // =====================================================
  // FILTER GROUPS
  // =====================================================

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredGroupList = this.groups.filter(group => {

      const matchesCmrc =
        this.selectedCmrcId === null ||
        Number(group.cmrcId) === Number(this.selectedCmrcId);

      const matchesVoAlf =
        this.selectedVoAlfId === null ||
        Number(group.voAlfId) === Number(this.selectedVoAlfId);

      const matchesSearch =
        !search ||
        String(group.groupName || '').toLowerCase().includes(search) ||
        String(group.villageName || '').toLowerCase().includes(search) ||
        String(group.voAlfName || '').toLowerCase().includes(search) ||
        String(group.cmrcName || '').toLowerCase().includes(search) ||
        String(group.id || '').includes(search);

      return matchesCmrc && matchesVoAlf && matchesSearch;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilters();
  }

  // =====================================================
  // ADD GROUP
  // =====================================================

  openAddForm(): void {
    this.clearMessages();

    if (this.selectedCmrcId === null) {
      this.errorMessage = 'Please select a CMRC first.';
      return;
    }

    if (this.selectedVoAlfId === null) {
      this.errorMessage = 'Please select a VO / ALF first.';
      return;
    }

    this.isEditMode = false;
    this.editingGroupId = null;

    this.newGroup = {
      cmrcId: this.selectedCmrcId,
      voAlfId: this.selectedVoAlfId,
      villageName: this.selectedVoAlfVillageName,
      groupName: ''
    } as Group;

    this.showForm = true;
  }

  // =====================================================
  // EDIT GROUP
  // =====================================================

// =====================================================
// EDIT GROUP
// =====================================================

editGroup(group: Group): void {
  this.clearMessages();

  this.isEditMode = true;
  this.editingGroupId = group.id ?? null;

  // Safely handle optional CMRC ID
  if (group.cmrcId != null) {
    this.selectedCmrcId = group.cmrcId;

    const selectedCmrc = this.cmrcList.find(
      item => Number(item.id) === Number(group.cmrcId)
    );

    this.selectedCmrcName =
      group.cmrcName || selectedCmrc?.cmrcName || '';

    this.selectedDistrict = selectedCmrc?.district || '';
    this.selectedTaluka = selectedCmrc?.taluka || '';

    // Load VO / ALF only when CMRC ID exists
    this.loadVoAlfList(group.cmrcId);
  } else {
    this.selectedCmrcId = null;
    this.selectedCmrcName = '';
    this.selectedDistrict = '';
    this.selectedTaluka = '';
    this.selectedVoAlfId = null;
    this.selectedVoAlfName = '';
    this.selectedVoAlfVillageName = '';
    this.voAlfList = [];
  }

  // Safely handle optional VO / ALF ID
  if (group.voAlfId != null) {
    this.selectedVoAlfId = group.voAlfId;
  } else {
    this.selectedVoAlfId = null;
  }

  const selectedVoAlf = this.voAlfList.find(
    item => Number(item.id) === Number(group.voAlfId)
  );

  this.selectedVoAlfName =
    group.voAlfName || selectedVoAlf?.voAlfName || '';

  this.selectedVoAlfVillageName =
    group.villageName || selectedVoAlf?.villageName || '';

  // Populate the edit form
  this.newGroup = {
    ...group,
    cmrcId: group.cmrcId ?? 0,
    voAlfId: group.voAlfId ?? 0,
    groupName: group.groupName || '',
    villageName: this.selectedVoAlfVillageName
  } as Group;

  this.showForm = true;
}
  // =====================================================
  // SAVE / UPDATE GROUP
  // =====================================================

  saveGroup(): void {
    this.clearMessages();

    const groupName = String(this.newGroup.groupName || '').trim();

    if (!groupName) {
      this.errorMessage = 'Group name is required.';
      return;
    }

    if (
      this.selectedCmrcId === null ||
      this.selectedVoAlfId === null
    ) {
      this.errorMessage = 'Please select a CMRC and VO / ALF.';
      return;
    }

    const payload: Group = {
      ...this.newGroup,
      cmrcId: this.selectedCmrcId,
      voAlfId: this.selectedVoAlfId,
      villageName: this.selectedVoAlfVillageName,
      groupName
    };

    this.isSaving = true;

    if (this.isEditMode && this.editingGroupId !== null) {
      this.groupService.update(
        this.editingGroupId,
        payload
      ).subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = 'Group updated successfully.';
          this.finishSave();
        },
        error: error => {
          this.isSaving = false;
          this.errorMessage =
            error?.error?.message || 'Unable to update group.';
        }
      });
    } else {
      this.groupService.create(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = 'Group added successfully.';
          this.finishSave();
        },
        error: error => {
          this.isSaving = false;
          this.errorMessage =
            error?.error?.message || 'Unable to add group.';
        }
      });
    }
  }

  // =====================================================
  // FINISH SAVE
  // =====================================================

  private finishSave(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingGroupId = null;

    this.newGroup = {
      cmrcId: this.selectedCmrcId ?? 0,
      voAlfId: this.selectedVoAlfId ?? 0,
      villageName: this.selectedVoAlfVillageName,
      groupName: ''
    } as Group;

    this.loadGroups();
  }

  // =====================================================
  // CANCEL FORM
  // =====================================================

  cancelForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingGroupId = null;
    this.clearMessages();

    this.newGroup = {
      cmrcId: this.selectedCmrcId ?? 0,
      voAlfId: this.selectedVoAlfId ?? 0,
      villageName: this.selectedVoAlfVillageName,
      groupName: ''
    } as Group;
  }

  // =====================================================
  // DELETE GROUP
  // =====================================================

  deleteGroup(id: number): void {
    if (id == null || this.deletingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this group?'
    );

    if (!confirmed) {
      return;
    }

    this.clearMessages();
    this.deletingId = id;

    this.groupService.delete(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage = 'Group deleted successfully.';
        this.loadGroups();
      },
      error: error => {
        this.deletingId = null;
        this.errorMessage =
          error?.error?.message ||
          'Unable to delete group. It may have associated members.';
      }
    });
  }

  // =====================================================
  // CLEAR ALERTS
  // =====================================================

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
