import { Component, OnInit } from '@angular/core';

import {
  GroupService,
  Group
} from '../services/group.service';

import {
  VoAlfService,
  VoAlf
} from '../services/vo-alf.service';

import {
  CmrcService,
  Cmrc
} from '../services/cmrc.service';


@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {

  // =====================================================
  // CMRC
  // =====================================================

  cmrcList: Cmrc[] = [];

  selectedCmrcId: number | null = null;

  selectedCmrcName = '';
  selectedDistrict = '';
  selectedTaluka = '';

  // =====================================================
  // VO / ALF
  // =====================================================

  voAlfList: VoAlf[] = [];

  selectedVoAlfId: number | null = null;

  selectedVoAlfName = '';

  selectedVoAlfVillageName = '';

  // =====================================================
  // GROUP
  // =====================================================

  groups: Group[] = [];

  filteredGroupList: Group[] = [];

  totalGroups = 0;

  // =====================================================
  // FORM
  // =====================================================

  showForm = false;

  isEditMode = false;

  isSaving = false;

  deletingId: number | null = null;

  editingGroupId: number | null = null;

  // =====================================================
  // NEW GROUP
  // =====================================================

  newGroup: Group = {
    cmrcId: 0,
    voAlfId: 0,
    villageName: '',
    groupName: ''
  };

  // =====================================================
  // MESSAGES
  // =====================================================

  errorMessage = '';

  successMessage = '';

  // =====================================================
  // LOADING
  // =====================================================

  loading = false;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private groupService: GroupService,
    private voAlfService: VoAlfService,
    private cmrcService: CmrcService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadCurrentCmrc();

  }


  // =====================================================
  // LOAD CURRENT USER CMRC
  // =====================================================

  loadCurrentCmrc(): void {

    this.loading = true;

    this.clearMessages();

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        if (this.cmrcList.length === 0) {

          this.selectedCmrcId = null;

          this.selectedCmrcName = '';
          this.selectedDistrict = '';
          this.selectedTaluka = '';

          this.voAlfList = [];
          this.groups = [];
          this.filteredGroupList = [];
          this.totalGroups = 0;

          this.errorMessage =
            'No CMRC is assigned to the logged-in user.';

          this.loading = false;

          return;
        }

        /*
         * Backend already returns only the
         * logged-in user's CMRC.
         */

        const cmrc = this.cmrcList[0];

        if (cmrc.id === undefined) {

          this.errorMessage =
            'Invalid CMRC data received from server.';

          this.loading = false;

          return;
        }

        this.selectedCmrcId = cmrc.id;

        this.selectedCmrcName =
          cmrc.cmrcName || '';

        this.selectedDistrict =
          cmrc.district || '';

        this.selectedTaluka =
          cmrc.taluka || '';

        // Load VO / ALF
        this.loadVoAlfByCmrc();

        // Load Groups
        this.loadGroupsByCurrentCmrc();

      },

      error: (error) => {

        console.error(
          'Error loading CMRC:',
          error
        );

        this.errorMessage =
          'Unable to load CMRC details.';

        this.loading = false;

      }

    });

  }


  // =====================================================
  // LOAD VO / ALF BY CMRC
  // =====================================================

  loadVoAlfByCmrc(): void {

    if (this.selectedCmrcId === null) {

      this.voAlfList = [];

      return;
    }

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

        },

        error: (error) => {

          console.error(
            'Error loading VO / ALF:',
            error
          );

          this.voAlfList = [];

          this.errorMessage =
            'Unable to load VO / ALF records.';

        }

      });

  }


  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    this.selectedVoAlfName = '';

    this.selectedVoAlfVillageName = '';

    if (this.selectedVoAlfId === null) {

      this.filteredGroupList =
        [...this.groups];

      return;
    }

    const selectedVoAlf =
      this.voAlfList.find(
        v => v.id === this.selectedVoAlfId
      );

    if (!selectedVoAlf) {

      return;
    }

    this.selectedVoAlfName =
      selectedVoAlf.voAlfName || '';

    this.selectedVoAlfVillageName =
      selectedVoAlf.villageName || '';

    /*
     * Filter groups by selected VO / ALF
     */

    this.filteredGroupList =
      this.groups.filter(
        group =>
          group.voAlfId === this.selectedVoAlfId
      );

    this.totalGroups =
      this.filteredGroupList.length;

  }


  // =====================================================
  // LOAD GROUPS
  // =====================================================

  loadGroupsByCurrentCmrc(): void {

    if (this.selectedCmrcId === null) {

      this.groups = [];

      this.filteredGroupList = [];

      this.totalGroups = 0;

      this.loading = false;

      return;
    }

    this.loading = true;

    this.groupService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: Group[]) => {

          this.groups = data || [];

          /*
           * Initially show all groups
           * under current CMRC.
           */

          this.filteredGroupList =
            [...this.groups];

          this.totalGroups =
            this.filteredGroupList.length;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'Error loading groups:',
            error
          );

          this.groups = [];

          this.filteredGroupList = [];

          this.totalGroups = 0;

          this.errorMessage =
            'Unable to load groups.';

          this.loading = false;

        }

      });

  }


  // =====================================================
  // LOAD ALL GROUPS
  // =====================================================

  loadAllGroups(): void {

    this.loadGroupsByCurrentCmrc();

  }


  // =====================================================
  // CMRC CHANGE
  // =====================================================

  onCmrcChange(): void {

    if (this.selectedCmrcId === null) {

      this.selectedCmrcName = '';
      this.selectedDistrict = '';
      this.selectedTaluka = '';

      this.selectedVoAlfId = null;

      this.selectedVoAlfName = '';

      this.selectedVoAlfVillageName = '';

      this.voAlfList = [];

      this.groups = [];

      this.filteredGroupList = [];

      this.totalGroups = 0;

      return;
    }

    const selectedCmrc =
      this.cmrcList.find(
        c => c.id === this.selectedCmrcId
      );

    if (!selectedCmrc) {

      return;
    }

    this.selectedCmrcName =
      selectedCmrc.cmrcName || '';

    this.selectedDistrict =
      selectedCmrc.district || '';

    this.selectedTaluka =
      selectedCmrc.taluka || '';

    this.selectedVoAlfId = null;

    this.selectedVoAlfName = '';

    this.selectedVoAlfVillageName = '';

    this.loadVoAlfByCmrc();

    this.loadGroupsByCurrentCmrc();

  }


  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  openAddForm(): void {

    this.clearMessages();

    if (this.selectedCmrcId === null) {

      this.errorMessage =
        'CMRC is not available.';

      return;
    }

    if (this.selectedVoAlfId === null) {

      this.errorMessage =
        'Please select VO / ALF first.';

      return;
    }

    const selectedVoAlf =
      this.voAlfList.find(
        v => v.id === this.selectedVoAlfId
      );

    if (!selectedVoAlf) {

      this.errorMessage =
        'Selected VO / ALF not found.';

      return;
    }

    this.showForm = true;

    this.isEditMode = false;

    this.editingGroupId = null;

    this.newGroup = {

      cmrcId:
        this.selectedCmrcId,

      voAlfId:
        this.selectedVoAlfId,

      villageName:
        selectedVoAlf.villageName || '',

      groupName:
        '',

      cmrcName:
        this.selectedCmrcName,

      voAlfName:
        selectedVoAlf.voAlfName || ''

    };

  }


  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(group: Group): void {

    this.clearMessages();

    if (this.selectedCmrcId === null) {

      this.errorMessage =
        'CMRC is not available.';

      return;
    }

    if (group.id === undefined) {

      this.errorMessage =
        'Invalid group ID.';

      return;
    }

    if (group.cmrcId !== this.selectedCmrcId) {

      this.errorMessage =
        'You are not authorized to edit this group.';

      return;
    }

    if (
      group.voAlfId === undefined ||
      group.voAlfId === null
    ) {

      this.errorMessage =
        'VO / ALF is not available for this group.';

      return;
    }

    this.showForm = true;

    this.isEditMode = true;

    this.editingGroupId =
      group.id;

    this.selectedVoAlfId =
      group.voAlfId;

    /*
     * Find VO / ALF
     */

    const selectedVoAlf =
      this.voAlfList.find(
        v => v.id === group.voAlfId
      );

    if (selectedVoAlf) {

      this.selectedVoAlfName =
        selectedVoAlf.voAlfName || '';

      this.selectedVoAlfVillageName =
        selectedVoAlf.villageName || '';

    } else {

      this.selectedVoAlfName =
        group.voAlfName || '';

      this.selectedVoAlfVillageName =
        group.villageName || '';

    }

    /*
     * Populate form
     */

    this.newGroup = {

      id:
        group.id,

      cmrcId:
        group.cmrcId,

      voAlfId:
        group.voAlfId,

      villageName:
        group.villageName || '',

      groupName:
        group.groupName || '',

      cmrcName:
        group.cmrcName || this.selectedCmrcName,

      voAlfName:
        group.voAlfName || this.selectedVoAlfName

    };

  }


  // =====================================================
  // SAVE GROUP
  // =====================================================

  saveGroup(): void {

    this.clearMessages();

    if (this.selectedCmrcId === null) {

      this.errorMessage =
        'CMRC is required.';

      return;
    }

    if (this.selectedVoAlfId === null) {

      this.errorMessage =
        'Please select VO / ALF.';

      return;
    }

    if (
      !this.newGroup.groupName ||
      this.newGroup.groupName.trim() === ''
    ) {

      this.errorMessage =
        'Group Name is required.';

      return;
    }

    const selectedVoAlf =
      this.voAlfList.find(
        v => v.id === this.selectedVoAlfId
      );

    if (!selectedVoAlf) {

      this.errorMessage =
        'Selected VO / ALF not found.';

      return;
    }

    /*
     * Always use current logged-in CMRC
     */

    this.newGroup.cmrcId =
      this.selectedCmrcId;

    /*
     * Always use selected VO / ALF
     */

    this.newGroup.voAlfId =
      this.selectedVoAlfId;

    /*
     * Village automatically comes
     * from selected VO / ALF
     */

    this.newGroup.villageName =
      selectedVoAlf.villageName || '';

    this.newGroup.cmrcName =
      this.selectedCmrcName;

    this.newGroup.voAlfName =
      selectedVoAlf.voAlfName || '';

    this.isSaving = true;

    // ===================================================
    // UPDATE
    // ===================================================

    if (
      this.isEditMode &&
      this.editingGroupId !== null
    ) {

      this.groupService
        .update(
          this.editingGroupId,
          this.newGroup
        )
        .subscribe({

          next: () => {

            this.isSaving = false;

            this.successMessage =
              'Group updated successfully.';

            this.closeForm();

            this.loadGroupsByCurrentCmrc();

          },

          error: (error) => {

            console.error(
              'Error updating group:',
              error
            );

            this.isSaving = false;

            this.errorMessage =
              this.getErrorMessage(
                error,
                'Unable to update group.'
              );

          }

        });

      return;
    }

    // ===================================================
    // CREATE
    // ===================================================

    this.groupService
      .create(this.newGroup)
      .subscribe({

        next: () => {

          this.isSaving = false;

          this.successMessage =
            'Group created successfully.';

          this.closeForm();

          this.loadGroupsByCurrentCmrc();

        },

        error: (error) => {

          console.error(
            'Error creating group:',
            error
          );

          this.isSaving = false;

          this.errorMessage =
            this.getErrorMessage(
              error,
              'Unable to create group.'
            );

        }

      });

  }


  // =====================================================
  // DELETE GROUP
  // =====================================================

  deleteGroup(groupId: number): void {

    this.clearMessages();

    if (!groupId) {

      this.errorMessage =
        'Invalid group ID.';

      return;
    }

    const group =
      this.groups.find(
        g => g.id === groupId
      );

    if (!group) {

      this.errorMessage =
        'Group not found.';

      return;
    }

    if (this.selectedCmrcId === null) {

      this.errorMessage =
        'CMRC is not available.';

      return;
    }

    if (group.cmrcId !== this.selectedCmrcId) {

      this.errorMessage =
        'You are not authorized to delete this group.';

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete group "${group.groupName}"?`
      );

    if (!confirmed) {

      return;
    }

    this.deletingId = groupId;

    this.groupService
      .delete(groupId)
      .subscribe({

        next: () => {

          this.deletingId = null;

          this.successMessage =
            'Group deleted successfully.';

          this.loadGroupsByCurrentCmrc();

        },

        error: (error) => {

          console.error(
            'Error deleting group:',
            error
          );

          this.deletingId = null;

          this.errorMessage =
            this.getErrorMessage(
              error,
              'Unable to delete group.'
            );

        }

      });

  }


  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.editingGroupId = null;

    this.newGroup = {

      cmrcId:
        this.selectedCmrcId || 0,

      voAlfId:
        this.selectedVoAlfId || 0,

      villageName:
        this.selectedVoAlfVillageName || '',

      groupName:
        '',

      cmrcName:
        this.selectedCmrcName,

      voAlfName:
        this.selectedVoAlfName

    };

  }


  // =====================================================
  // SELECTED CMRC NAME
  // =====================================================

  getSelectedCmrcName(): string {

    return this.selectedCmrcName;

  }


  // =====================================================
  // SELECTED DISTRICT
  // =====================================================

  getSelectedDistrict(): string {

    return this.selectedDistrict;

  }


  // =====================================================
  // SELECTED TALUKA
  // =====================================================

  getSelectedTaluka(): string {

    return this.selectedTaluka;

  }


  // =====================================================
  // ERROR MESSAGE
  // =====================================================

  private getErrorMessage(
    error: any,
    defaultMessage: string
  ): string {

    if (
      error &&
      error.error
    ) {

      if (
        typeof error.error === 'string' &&
        error.error.trim()
      ) {

        return error.error;

      }

      if (
        error.error.message
      ) {

        return error.error.message;

      }

    }

    if (
      error &&
      error.message
    ) {

      return error.message;

    }

    return defaultMessage;

  }


  // =====================================================
  // CLEAR MESSAGES
  // =====================================================

  clearMessages(): void {

    this.errorMessage = '';

    this.successMessage = '';

  }

}