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


  // =====================================================
  // VO / ALF
  // =====================================================

  voAlfList: VoAlf[] = [];

  selectedVoAlfId: number | null = null;


  // =====================================================
  // VILLAGE
  // =====================================================

  selectedVillageName = '-';

  selectedVoAlfVillageName = '-';


  // =====================================================
  // GROUP
  // =====================================================

  groupList: Group[] = [];

  searchText = '';


  // =====================================================
  // FORM
  // =====================================================

  showForm = false;

  isEditMode = false;

  isSaving = false;

  deletingId: number | null = null;


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
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private groupService: GroupService,
    private voAlfService: VoAlfService,
    private cmrcService: CmrcService
  ) {}


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  ngOnInit(): void {

    // Load ALL GROUPS initially
    this.loadAllGroups();

    // Load all CMRC
    this.loadCmrcList();
  }


  // =====================================================
  // TOTAL GROUPS
  // =====================================================

  get totalGroups(): number {

    return this.groupList.length;
  }


  // =====================================================
  // LOAD ALL GROUPS
  // =====================================================

  loadAllGroups(): void {

    this.groupService
      .getAll()
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

        },

        error: (err) => {

          console.error(
            'Error loading all groups:',
            err
          );

          this.groupList = [];
        }
      });
  }


  // =====================================================
  // LOAD CMRC
  // =====================================================

  loadCmrcList(): void {

    this.cmrcService
      .getAll()
      .subscribe({

        next: (data: Cmrc[]) => {

          this.cmrcList = data || [];

        },

        error: (err) => {

          console.error(
            'Error loading CMRC:',
            err
          );

          this.cmrcList = [];
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
    this.selectedVillageName = '-';

    this.selectedVoAlfVillageName = '-';


    // Close form
    this.showForm = false;

    this.searchText = '';


    // =================================================
    // NO CMRC SELECTED
    // =================================================

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      // Show ALL groups
      this.loadAllGroups();

      return;
    }


    // =================================================
    // LOAD VO / ALF
    // =================================================

    this.loadVoAlfByCmrc();


    // =================================================
    // LOAD GROUPS BY CMRC
    // =================================================

    this.groupService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

        },

        error: (err) => {

          console.error(
            'Error loading groups by CMRC:',
            err
          );

          this.groupList = [];
        }
      });
  }


  // =====================================================
  // LOAD VO / ALF BY CMRC
  // =====================================================

  loadVoAlfByCmrc(): void {

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      this.voAlfList = [];

      return;
    }


    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

        },

        error: (err) => {

          console.error(
            'Error loading VO / ALF:',
            err
          );

          this.voAlfList = [];
        }
      });
  }


  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    // Reset Village
    this.selectedVillageName = '-';

    this.selectedVoAlfVillageName = '-';


    // Close form
    this.showForm = false;

    this.searchText = '';


    // =================================================
    // NO VO / ALF SELECTED
    // =================================================

    if (
      this.selectedVoAlfId === null ||
      this.selectedVoAlfId === undefined
    ) {

      if (
        this.selectedCmrcId !== null &&
        this.selectedCmrcId !== undefined
      ) {

        // Show groups under selected CMRC
        this.groupService
          .getByCmrcId(this.selectedCmrcId)
          .subscribe({

            next: (data: Group[]) => {

              this.groupList = data || [];

            },

            error: (err) => {

              console.error(
                'Error loading groups:',
                err
              );

              this.groupList = [];
            }
          });

      } else {

        // Show ALL groups
        this.loadAllGroups();
      }

      return;
    }


    // =================================================
    // FIND SELECTED VO / ALF
    // =================================================

    const selectedVoAlf =
      this.voAlfList.find(
        (voAlf: VoAlf) =>
          voAlf.id === this.selectedVoAlfId
      );


    // =================================================
    // GET VILLAGE NAME
    // =================================================

    if (selectedVoAlf) {

      this.selectedVillageName =
        selectedVoAlf.villageName || '-';

      this.selectedVoAlfVillageName =
        selectedVoAlf.villageName || '-';


      console.log(
        'Selected VO / ALF:',
        selectedVoAlf
      );

      console.log(
        'Selected Village Name:',
        this.selectedVillageName
      );
    }


    // =================================================
    // LOAD GROUPS BY VO / ALF
    // =================================================

    this.groupService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

        },

        error: (err) => {

          console.error(
            'Error loading groups by VO / ALF:',
            err
          );

          this.groupList = [];
        }
      });
  }


  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  openAddForm(): void {

    // CMRC validation
    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      alert('Please select CMRC');

      return;
    }


    // VO / ALF validation
    if (
      this.selectedVoAlfId === null ||
      this.selectedVoAlfId === undefined
    ) {

      alert('Please select VO / ALF');

      return;
    }


    // =================================================
    // GET SELECTED VO / ALF
    // =================================================

    const selectedVoAlf =
      this.voAlfList.find(
        (voAlf: VoAlf) =>
          voAlf.id === this.selectedVoAlfId
      );


    if (!selectedVoAlf) {

      alert(
        'Selected VO / ALF information is not available.'
      );

      return;
    }


    // =================================================
    // GET VILLAGE NAME
    // =================================================

    const villageName =
      selectedVoAlf.villageName
        ? selectedVoAlf.villageName.trim()
        : '';


    if (!villageName) {

      alert(
        'Village information is not available for selected VO / ALF'
      );

      return;
    }


    this.selectedVillageName =
      villageName;

    this.selectedVoAlfVillageName =
      villageName;


    // =================================================
    // OPEN FORM
    // =================================================

    this.isEditMode = false;

    this.showForm = true;

    this.isSaving = false;


    // =================================================
    // CREATE NEW GROUP
    // =================================================

    this.newGroup = {

      cmrcId:
        this.selectedCmrcId,

      voAlfId:
        this.selectedVoAlfId,

      villageName:
        villageName,

      groupName:
        ''
    };
  }


  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(group: Group): void {

    this.isEditMode = true;

    this.showForm = true;

    this.isSaving = false;


    // =================================================
    // SET SELECTED CMRC
    // =================================================

    this.selectedCmrcId =
      group.cmrcId;


    // =================================================
    // LOAD VO / ALF FOR SELECTED CMRC
    // =================================================

    this.voAlfService
      .getByCmrcId(group.cmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList =
            data || [];


          this.selectedVoAlfId =
            group.voAlfId;


          // =================================================
          // VILLAGE
          // =================================================

          const selectedVoAlf =
            this.voAlfList.find(
              (voAlf: VoAlf) =>
                voAlf.id === group.voAlfId
            );


          this.selectedVillageName =
            group.villageName ||
            selectedVoAlf?.villageName ||
            '-';


          this.selectedVoAlfVillageName =
            this.selectedVillageName;


          // =================================================
          // EDIT OBJECT
          // =================================================

          this.newGroup = {

            id:
              group.id,

            cmrcId:
              group.cmrcId,

            voAlfId:
              group.voAlfId,

            villageName:
              this.selectedVillageName,

            groupName:
              group.groupName || ''
          };

        },

        error: (err) => {

          console.error(
            'Error loading VO / ALF for edit:',
            err
          );

          this.showForm = false;

          alert(
            'Unable to load VO / ALF information.'
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

    this.isSaving = false;


    this.newGroup = {

      cmrcId:
        this.selectedCmrcId || 0,

      voAlfId:
        this.selectedVoAlfId || 0,

      villageName:
        this.selectedVillageName || '',

      groupName:
        ''
    };
  }


  // =====================================================
  // SAVE GROUP
  // =====================================================

  saveGroup(): void {

    // =================================================
    // CMRC VALIDATION
    // =================================================

    if (
      this.selectedCmrcId === null ||
      this.selectedCmrcId === undefined
    ) {

      alert('Please select CMRC');

      return;
    }


    // =================================================
    // VO / ALF VALIDATION
    // =================================================

    if (
      this.selectedVoAlfId === null ||
      this.selectedVoAlfId === undefined
    ) {

      alert('Please select VO / ALF');

      return;
    }


    // =================================================
    // FIND SELECTED VO / ALF
    // =================================================

    const selectedVoAlf =
      this.voAlfList.find(
        (voAlf: VoAlf) =>
          voAlf.id === this.selectedVoAlfId
      );


    if (!selectedVoAlf) {

      alert(
        'Selected VO / ALF information is not available.'
      );

      return;
    }


    // =================================================
    // VILLAGE NAME
    // =================================================

    const villageName =
      selectedVoAlf.villageName
        ? selectedVoAlf.villageName.trim()
        : '';


    if (!villageName) {

      alert(
        'Village information is not available for selected VO / ALF'
      );

      return;
    }


    // =================================================
    // GROUP NAME
    // =================================================

    if (
      !this.newGroup.groupName ||
      !this.newGroup.groupName.trim()
    ) {

      alert('Please enter Group Name');

      return;
    }


    // =================================================
    // FINAL PAYLOAD
    // =================================================

    const payload: Group = {

      id:
        this.newGroup.id,

      cmrcId:
        this.selectedCmrcId,

      voAlfId:
        this.selectedVoAlfId,

      villageName:
        villageName,

      groupName:
        this.newGroup.groupName.trim()
    };


    console.log(
      'Group Save Payload:',
      payload
    );


    this.isSaving = true;


    // =================================================
    // UPDATE
    // =================================================

    if (
      this.isEditMode &&
      this.newGroup.id
    ) {

      this.groupService
        .update(
          this.newGroup.id,
          payload
        )
        .subscribe({

          next: (response: Group) => {

            console.log(
              'Group updated:',
              response
            );

            this.isSaving = false;

            this.showForm = false;

            this.isEditMode = false;


            // Reload ALL groups
            this.loadAllGroups();


            alert(
              'Group updated successfully'
            );
          },

          error: (err) => {

            console.error(
              'Error updating group:',
              err
            );

            this.isSaving = false;

            alert(
              'Error updating group'
            );
          }
        });

      return;
    }


    // =================================================
    // CREATE
    // =================================================

    this.groupService
      .create(payload)
      .subscribe({

        next: (response: Group) => {

          console.log(
            'Group created:',
            response
          );

          this.isSaving = false;

          this.showForm = false;


          // Reload ALL groups
          this.loadAllGroups();


          alert(
            'Group created successfully'
          );
        },

        error: (err) => {

          console.error(
            'Error creating group:',
            err
          );

          this.isSaving = false;

          alert(
            'Error creating group'
          );
        }
      });
  }


  // =====================================================
  // DELETE GROUP
  // =====================================================

  deleteGroup(id?: number): void {

    if (!id) {
      return;
    }


    if (
      !confirm(
        'Are you sure you want to delete this group?'
      )
    ) {

      return;
    }


    this.deletingId = id;


    this.groupService
      .delete(id)
      .subscribe({

        next: () => {

          this.deletingId = null;


          // Reload ALL groups
          this.loadAllGroups();


          alert(
            'Group deleted successfully'
          );
        },

        error: (err) => {

          console.error(
            'Error deleting group:',
            err
          );

          this.deletingId = null;

          alert(
            'Error deleting group'
          );
        }
      });
  }


  // =====================================================
  // FILTER
  // =====================================================

  get filteredGroupList(): Group[] {

    if (!this.searchText) {

      return this.groupList;
    }


    const search =
      this.searchText
        .toLowerCase()
        .trim();


    return this.groupList.filter(
      (group: Group) =>

        (group.groupName || '')
          .toLowerCase()
          .includes(search)

        ||

        (group.villageName || '')
          .toLowerCase()
          .includes(search)

        ||

        (group.voAlfName || '')
          .toLowerCase()
          .includes(search)

        ||

        (group.cmrcName || '')
          .toLowerCase()
          .includes(search)
    );
  }


  // =====================================================
  // SELECTED CMRC NAME
  // =====================================================

  get selectedCmrcName(): string {

    const cmrc =
      this.cmrcList.find(
        (item: Cmrc) =>
          item.id === this.selectedCmrcId
      );

    return cmrc?.cmrcName || '-';
  }


  // =====================================================
  // SELECTED VO / ALF
  // =====================================================

  get selectedVoAlf(): VoAlf | undefined {

    return this.voAlfList.find(
      (item: VoAlf) =>
        item.id === this.selectedVoAlfId
    );
  }


  // =====================================================
  // SELECTED VO / ALF NAME
  // =====================================================

  get selectedVoAlfName(): string {

    return this.selectedVoAlf?.voAlfName || '-';
  }


  // =====================================================
  // SELECTED VILLAGE NAME
  // =====================================================

  get selectedVillageDisplayName(): string {

    return this.selectedVillageName || '-';
  }
}