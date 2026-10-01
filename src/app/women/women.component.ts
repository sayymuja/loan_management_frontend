import { Component, OnInit } from '@angular/core';

import {
  Cmrc,
  CmrcService
} from '../services/cmrc.service';

import {
  VoAlfService,
  VoAlf
} from '../services/vo-alf.service';

import {
  GroupService,
  Group
} from '../services/group.service';

import {
  WomenService,
  Women
} from '../services/women.service';


@Component({
  selector: 'app-women',
  templateUrl: './women.component.html',
  styleUrls: ['./women.component.css']
})
export class WomenComponent implements OnInit {

  // =====================================================
  // CMRC
  // =====================================================

  cmrcList: Cmrc[] = [];

  selectedCmrcId: number | null = null;

  selectedDistrict = '';
  selectedTaluka = '';


  // =====================================================
  // VO / ALF
  // =====================================================

  voAlfList: VoAlf[] = [];

  selectedVoAlfId: number | null = null;


  // =====================================================
  // GROUP
  // =====================================================

  groupList: Group[] = [];

  selectedGroupId: number | null = null;


  // =====================================================
  // WOMEN
  // =====================================================

  womenList: Women[] = [];

  searchText = '';


  // =====================================================
  // FORM
  // =====================================================

  showForm = false;

  isEditMode = false;

  isSaving = false;

  deletingId: number | null = null;


  // =====================================================
  // NEW WOMAN
  // =====================================================

  newWomen: Women = {

    groupId: 0,

    womanName: '',

    husbandName: '',

    mobileNo: '',

    address: '',

    status: 'ACTIVE'

  };


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadCurrentCmrc();

    this.loadAllWomen();

  }


  // =====================================================
  // LOAD CURRENT USER CMRC
  // =====================================================

  loadCurrentCmrc(): void {

    this.cmrcService.getAll().subscribe({

      next: (data: Cmrc[]) => {

        this.cmrcList = data || [];

        if (this.cmrcList.length === 0) {

          this.selectedCmrcId = null;

          this.selectedDistrict = '';
          this.selectedTaluka = '';

          this.voAlfList = [];
          this.groupList = [];

          return;
        }


        /*
         * Backend already returns only the CMRC
         * assigned to logged-in user.
         */

        const cmrc = this.cmrcList[0];


        if (cmrc.id === undefined) {

          console.error(
            'Invalid CMRC ID received.'
          );

          return;
        }


        this.selectedCmrcId = cmrc.id;


        this.selectedDistrict =
          cmrc.district || '';


        this.selectedTaluka =
          cmrc.taluka || '';


        // Load VO / ALF
        this.loadVoAlfByCmrc(
          this.selectedCmrcId
        );

      },

      error: (error: any) => {

        console.error(
          'CMRC API Error:',
          error
        );

        this.cmrcList = [];

      }

    });

  }


  // =====================================================
  // LOAD ALL WOMEN
  // =====================================================

  loadAllWomen(): void {

    this.womenService.getAll().subscribe({

      next: (data: Women[]) => {

        this.womenList = data || [];

        console.log(
          'WOMEN:',
          this.womenList
        );

      },

      error: (error: any) => {

        console.error(
          'Women API Error:',
          error
        );

        this.womenList = [];

      }

    });

  }


  // =====================================================
  // CMRC CHANGE
  // =====================================================

  /*
   * CMRC is automatic for logged-in user.
   *
   * This method is kept for compatibility
   * with existing HTML.
   */

  onCmrcChange(): void {

    this.selectedVoAlfId = null;

    this.selectedGroupId = null;

    this.voAlfList = [];

    this.groupList = [];

    this.searchText = '';

    this.closeForm();


    if (this.selectedCmrcId === null) {

      return;

    }


    this.loadVoAlfByCmrc(
      this.selectedCmrcId
    );

  }


  // =====================================================
  // LOAD VO / ALF BY CMRC
  // =====================================================

  loadVoAlfByCmrc(
    cmrcId: number
  ): void {

    this.voAlfService
      .getByCmrcId(cmrcId)
      .subscribe({

        next: (data: VoAlf[]) => {

          this.voAlfList = data || [];

          console.log(
            'VO / ALF FOR CMRC:',
            cmrcId,
            this.voAlfList
          );

        },

        error: (error: any) => {

          console.error(
            'VO / ALF API Error:',
            error
          );

          this.voAlfList = [];

        }

      });

  }


  // =====================================================
  // VO / ALF CHANGE
  // =====================================================

  onVoAlfChange(): void {

    this.selectedGroupId = null;

    this.groupList = [];

    this.searchText = '';

    this.closeForm();


    if (this.selectedVoAlfId === null) {

      return;

    }


    this.loadGroupsByVoAlf(
      this.selectedVoAlfId
    );

  }


  // =====================================================
  // LOAD GROUPS BY VO / ALF
  // =====================================================

  loadGroupsByVoAlf(
    voAlfId: number
  ): void {

    this.groupService
      .getByVoAlfId(voAlfId)
      .subscribe({

        next: (data: Group[]) => {

          this.groupList = data || [];

          console.log(
            'GROUPS FOR VO / ALF:',
            voAlfId,
            this.groupList
          );

        },

        error: (error: any) => {

          console.error(
            'Group API Error:',
            error
          );

          this.groupList = [];

        }

      });

  }


  // =====================================================
  // GROUP CHANGE
  // =====================================================

  onGroupChange(): void {

    this.searchText = '';

    this.closeForm();

    console.log(
      'SELECTED GROUP:',
      this.selectedGroupId
    );

  }


  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  openAddForm(): void {

    if (this.selectedCmrcId === null) {

      alert(
        'CMRC is not available.'
      );

      return;
    }


    if (this.selectedVoAlfId === null) {

      alert(
        'Please select VO / ALF first.'
      );

      return;
    }


    if (this.selectedGroupId === null) {

      alert(
        'Please select Group first.'
      );

      return;
    }


    this.isEditMode = false;

    this.showForm = true;

    this.isSaving = false;


    this.newWomen = {

      groupId:
        this.selectedGroupId,

      womanName: '',

      husbandName: '',

      mobileNo: '',

      address: '',

      status: 'ACTIVE'

    };


    this.scrollToForm();

  }


  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  openEditForm(
    women: Women
  ): void {

    this.isEditMode = true;

    this.showForm = true;

    this.isSaving = false;


    if (
      women.groupId === undefined ||
      women.groupId === null
    ) {

      alert(
        'Group information is missing.'
      );

      this.closeForm();

      return;
    }


    this.newWomen = {

      id:
        women.id,

      groupId:
        Number(women.groupId),

      womanName:
        women.womanName || '',

      husbandName:
        women.husbandName || '',

      mobileNo:
        women.mobileNo || '',

      address:
        women.address || '',

      status:
        women.status || 'ACTIVE'

    };


    /*
     * Set selected group for edit.
     */

    this.selectedGroupId =
      Number(women.groupId);


    /*
     * If VO / ALF ID is available from
     * returned Women record, restore it.
     */

    if (
      women.voAlfId !== undefined &&
      women.voAlfId !== null
    ) {

      this.selectedVoAlfId =
        Number(women.voAlfId);

    }


    this.scrollToForm();

  }


  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {

    this.showForm = false;

    this.isEditMode = false;

    this.isSaving = false;

  }


  // =====================================================
  // SAVE / UPDATE
  // =====================================================

  saveWomen(): void {

    if (this.selectedCmrcId === null) {

      alert(
        'CMRC is not available.'
      );

      return;

    }


    if (this.selectedVoAlfId === null) {

      alert(
        'Please select VO / ALF.'
      );

      return;

    }


    if (this.selectedGroupId === null) {

      alert(
        'Please select Group.'
      );

      return;

    }


    if (
      !this.newWomen.womanName ||
      !this.newWomen.womanName.trim()
    ) {

      alert(
        'Please enter Woman Name.'
      );

      return;

    }


    if (this.isSaving) {

      return;

    }


    this.isSaving = true;


    /*
     * Always use currently selected group.
     */

    this.newWomen.groupId =
      this.selectedGroupId;


    // ===================================================
    // UPDATE
    // ===================================================

    if (
      this.isEditMode &&
      this.newWomen.id != null
    ) {

      this.womenService
        .update(
          this.newWomen.id,
          this.newWomen
        )
        .subscribe({

          next: () => {

            alert(
              'Woman updated successfully.'
            );

            this.closeForm();

            this.isSaving = false;

            this.loadAllWomen();

          },

          error: (error: any) => {

            console.error(
              'Update Woman Error:',
              error
            );

            alert(
              'Failed to update woman.'
            );

            this.isSaving = false;

          }

        });

      return;

    }


    // ===================================================
    // CREATE
    // ===================================================

    this.womenService
      .create(this.newWomen)
      .subscribe({

        next: () => {

          alert(
            'Woman added successfully.'
          );

          this.closeForm();

          this.isSaving = false;

          this.loadAllWomen();

        },

        error: (error: any) => {

          console.error(
            'Create Woman Error:',
            error
          );

          alert(
            'Failed to add woman.'
          );

          this.isSaving = false;

        }

      });

  }


  // =====================================================
  // DELETE
  // =====================================================

  deleteWomen(
    id: number
  ): void {

    if (
      !confirm(
        'Are you sure you want to delete this woman?'
      )
    ) {

      return;

    }


    this.deletingId = id;


    this.womenService
      .delete(id)
      .subscribe({

        next: () => {

          alert(
            'Woman deleted successfully.'
          );

          this.deletingId = null;

          this.loadAllWomen();

        },

        error: (error: any) => {

          console.error(
            'Delete Woman Error:',
            error
          );

          alert(
            'Failed to delete woman.'
          );

          this.deletingId = null;

        }

      });

  }


  // =====================================================
  // FILTER WOMEN
  // =====================================================

  get filteredWomenList(): Women[] {

    const search =
      (this.searchText || '')
        .trim()
        .toLowerCase();


    return this.womenList.filter(
      (women: Women) => {

        // =================================================
        // CMRC FILTER
        // =================================================

        if (
          this.selectedCmrcId !== null
        ) {

          const womanCmrcId =
            Number(women.cmrcId);

          const selectedCmrcId =
            Number(this.selectedCmrcId);


          if (
            !womanCmrcId ||
            womanCmrcId !== selectedCmrcId
          ) {

            return false;

          }

        }


        // =================================================
        // VO / ALF FILTER
        // =================================================

        if (
          this.selectedVoAlfId !== null
        ) {

          const womanVoAlfId =
            Number(women.voAlfId);

          const selectedVoAlfId =
            Number(this.selectedVoAlfId);


          if (
            !womanVoAlfId ||
            womanVoAlfId !== selectedVoAlfId
          ) {

            return false;

          }

        }


        // =================================================
        // GROUP FILTER
        // =================================================

        if (
          this.selectedGroupId !== null
        ) {

          const womanGroupId =
            Number(women.groupId);

          const selectedGroupId =
            Number(this.selectedGroupId);


          if (
            !womanGroupId ||
            womanGroupId !== selectedGroupId
          ) {

            return false;

          }

        }


        // =================================================
        // SEARCH
        // =================================================

        if (!search) {

          return true;

        }


        return (

          (women.womanName || '')
            .toLowerCase()
            .includes(search)

          ||

          (women.husbandName || '')
            .toLowerCase()
            .includes(search)

          ||

          (women.mobileNo || '')
            .toLowerCase()
            .includes(search)

          ||

          (women.address || '')
            .toLowerCase()
            .includes(search)

          ||

          (women.groupName || '')
            .toLowerCase()
            .includes(search)

          ||

          (women.villageName || '')
            .toLowerCase()
            .includes(search)

        );

      }
    );

  }


  // =====================================================
  // TOTAL WOMEN
  // =====================================================

  get totalWomen(): number {

    return this.filteredWomenList.length;

  }


  // =====================================================
  // SELECTED CMRC NAME
  // =====================================================

  get selectedCmrcName(): string {

    const cmrc =
      this.cmrcList.find(
        (item: Cmrc) =>
          Number(item.id) ===
          Number(this.selectedCmrcId)
      );

    return cmrc?.cmrcName || '-';

  }


  // =====================================================
  // SELECTED VO / ALF
  // =====================================================

  get selectedVoAlf(): VoAlf | undefined {

    return this.voAlfList.find(
      (item: VoAlf) =>
        Number(item.id) ===
        Number(this.selectedVoAlfId)
    );

  }


  get selectedVoAlfName(): string {

    return this.selectedVoAlf?.voAlfName || '-';

  }


  // =====================================================
  // SELECTED VILLAGE
  // =====================================================

  get selectedVillageName(): string {

    return this.selectedVoAlf?.villageName || '-';

  }


  // =====================================================
  // SELECTED GROUP NAME
  // =====================================================

  get selectedGroupName(): string {

    const group =
      this.groupList.find(
        (item: Group) =>
          Number(item.id) ===
          Number(this.selectedGroupId)
      );

    return group?.groupName || '-';

  }


  // =====================================================
  // SCROLL TO FORM
  // =====================================================

  private scrollToForm(): void {

    setTimeout(() => {

      const formElement =
        document.querySelector(
          '.form-card'
        );

      if (formElement) {

        formElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      }

    }, 100);

  }

}