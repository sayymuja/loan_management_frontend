import { Component, OnInit } from '@angular/core';

import { Cmrc, CmrcService } from '../services/cmrc.service';
import { VoAlf, VoAlfService } from '../services/vo-alf.service';
import { Group, GroupService } from '../services/group.service';
import { Women, WomenService } from '../services/women.service';

type ManagementTab = 'groups' | 'members';

@Component({
  selector: 'app-group-members',
  templateUrl: './group-members.component.html',
  styleUrls: ['./group-members.component.css']
})
export class GroupMembersComponent implements OnInit {

  activeTab: ManagementTab = 'groups';

  cmrcList: Cmrc[] = [];
  currentUserCmrcId: number | null = null;

  // =====================================================
  // GROUP TAB
  // =====================================================

  groupCmrcId: number | null = null;
  groupCmrcName = '';
  groupDistrict = '';
  groupTaluka = '';

  groupVoAlfList: VoAlf[] = [];
  groupVoAlfId: number | null = null;
  groupVoAlfName = '';
  groupVillageName = '';

  groups: Group[] = [];
  filteredGroupList: Group[] = [];
  totalGroups = 0;

  showGroupForm = false;
  isEditGroup = false;
  isSavingGroup = false;
  deletingGroupId: number | null = null;
  editingGroupId: number | null = null;

  newGroup: Group = this.emptyGroup();

  groupError = '';
  groupSuccess = '';
  loadingGroups = false;

  // =====================================================
  // MEMBERS TAB
  // =====================================================

  memberCmrcId: number | null = null;
  memberVoAlfId: number | null = null;
  memberGroupId: number | null = null;

  memberVoAlfList: VoAlf[] = [];
  memberGroupList: Group[] = [];

  womenList: Women[] = [];
  searchText = '';

  showMemberForm = false;
  isEditMember = false;
  isSavingMember = false;
  deletingMemberId: number | null = null;

  newWomen: Women = {
    groupId: 0,
    womanName: '',
    husbandName: '',
    mobileNo: '',
    address: '',
    status: 'ACTIVE'
  };

  memberError = '';
  memberSuccess = '';
  loadingMembers = false;

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCmrc();
    this.loadAllWomen();
  }

  // =====================================================
  // COMMON
  // =====================================================

  selectTab(tab: ManagementTab): void {
    this.activeTab = tab;
  }

  private loadCurrentUser(): void {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        this.currentUserCmrcId = null;
        return;
      }

      const user = JSON.parse(storedUser);

      this.currentUserCmrcId =
        user.cmrcId != null ? Number(user.cmrcId) : null;

    } catch (error) {
      console.error('Unable to read logged-in user:', error);
      this.currentUserCmrcId = null;
    }
  }

  private emptyGroup(): Group {
    return {
      cmrcId: this.groupCmrcId ?? 0,
      voAlfId: this.groupVoAlfId ?? 0,
      villageName: this.groupVillageName || '',
      groupName: '',
      cmrcName: this.groupCmrcName || '',
      voAlfName: this.groupVoAlfName || ''
    };
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || error?.message || fallback;
  }

  private clearGroupMessages(): void {
    this.groupError = '';
    this.groupSuccess = '';
  }

  private clearMemberMessages(): void {
    this.memberError = '';
    this.memberSuccess = '';
  }

  // =====================================================
  // CMRC
  // =====================================================

  loadCmrc(): void {
    this.cmrcService.getAll().subscribe({
      next: (data: Cmrc[]) => {
        const allCmrc = data || [];

        // Prefer the CMRC assigned to the logged-in user.
        // If no user CMRC ID exists, use the first backend result.
        let selectedCmrc: Cmrc | undefined;

        if (this.currentUserCmrcId != null) {
          selectedCmrc = allCmrc.find(
            item => Number(item.id) === Number(this.currentUserCmrcId)
          );
        } else {
          selectedCmrc = allCmrc[0];
        }

        this.cmrcList = selectedCmrc ? [selectedCmrc] : [];

        if (!selectedCmrc || selectedCmrc.id == null) {
          this.resetManagementData();
          this.groupError = 'No CMRC is assigned to the logged-in user.';
          this.memberError = 'No CMRC is assigned to the logged-in user.';
          return;
        }

        const cmrcId = Number(selectedCmrc.id);

        this.groupCmrcId = cmrcId;
        this.memberCmrcId = cmrcId;

        this.updateGroupCmrcDetails();

        this.loadGroupVoAlf();
        this.loadGroups();
        this.loadMemberVoAlf();
      },
      error: (error) => {
        console.error('Error loading CMRC:', error);

        this.cmrcList = [];
        this.resetManagementData();

        this.groupError = 'Unable to load CMRC details.';
        this.memberError = 'Unable to load CMRC details.';
      }
    });
  }

  private resetManagementData(): void {
    this.groupCmrcId = null;
    this.memberCmrcId = null;

    this.groupVoAlfId = null;
    this.memberVoAlfId = null;
    this.memberGroupId = null;

    this.groupVoAlfList = [];
    this.memberVoAlfList = [];
    this.memberGroupList = [];

    this.groups = [];
    this.filteredGroupList = [];
    this.totalGroups = 0;

    this.showGroupForm = false;
    this.showMemberForm = false;
  }

  // =====================================================
  // GROUP: CMRC / VO-ALF
  // =====================================================

  onGroupCmrcChange(): void {
    this.groupVoAlfId = null;
    this.groupVoAlfName = '';
    this.groupVillageName = '';

    this.showGroupForm = false;
    this.clearGroupMessages();

    this.updateGroupCmrcDetails();
    this.loadGroupVoAlf();
    this.loadGroups();

    // Keep the Members tab aligned with the selected CMRC.
    this.memberCmrcId = this.groupCmrcId;
    this.memberVoAlfId = null;
    this.memberGroupId = null;
    this.memberGroupList = [];
    this.memberVoAlfList = [];
    this.showMemberForm = false;

    this.loadMemberVoAlf();
  }

  private updateGroupCmrcDetails(): void {
    const cmrc = this.cmrcList.find(
      item => Number(item.id) === Number(this.groupCmrcId)
    );

    this.groupCmrcName = cmrc?.cmrcName || '';
    this.groupDistrict = cmrc?.district || '';
    this.groupTaluka = cmrc?.taluka || '';
  }

  private loadGroupVoAlf(): void {
    if (this.groupCmrcId == null) {
      this.groupVoAlfList = [];
      return;
    }

    this.voAlfService.getByCmrcId(this.groupCmrcId).subscribe({
      next: (data: VoAlf[]) => {
        this.groupVoAlfList = data || [];
      },
      error: (error) => {
        console.error('Error loading Group tab VO / ALF:', error);
        this.groupVoAlfList = [];
        this.groupError = 'Unable to load VO / ALF records.';
      }
    });
  }

  onGroupVoAlfChange(): void {
    const voAlf = this.groupVoAlfList.find(
      item => Number(item.id) === Number(this.groupVoAlfId)
    );

    this.groupVoAlfName = voAlf?.voAlfName || '';
    this.groupVillageName = voAlf?.villageName || '';

    this.clearGroupMessages();
    this.showGroupForm = false;

    // Synchronize the VO/ALF selection for Members.
    this.memberCmrcId = this.groupCmrcId;
    this.memberVoAlfId = this.groupVoAlfId;
    this.memberGroupId = null;
    this.memberGroupList = [];
    this.showMemberForm = false;
    this.searchText = '';

    this.loadMemberVoAlf();

    if (this.memberVoAlfId != null) {
      this.loadMemberGroups();
    }

    this.applyGroupFilter();
  }

  // =====================================================
  // GROUP: LOAD / FILTER
  // =====================================================

  loadGroups(): void {
    if (this.groupCmrcId == null) {
      this.groups = [];
      this.filteredGroupList = [];
      this.totalGroups = 0;
      this.loadingGroups = false;
      return;
    }

    this.loadingGroups = true;

    this.groupService.getByCmrcId(this.groupCmrcId).subscribe({
      next: (data: Group[]) => {
        this.groups = data || [];
        this.applyGroupFilter();
        this.loadingGroups = false;
      },
      error: (error) => {
        console.error('Error loading groups:', error);

        this.groups = [];
        this.filteredGroupList = [];
        this.totalGroups = 0;
        this.loadingGroups = false;

        this.groupError = 'Unable to load groups.';
      }
    });
  }

  private applyGroupFilter(): void {
    this.filteredGroupList = this.groups.filter(group => {
      if (
        this.groupVoAlfId != null &&
        Number(group.voAlfId) !== Number(this.groupVoAlfId)
      ) {
        return false;
      }

      return true;
    });

    this.totalGroups = this.filteredGroupList.length;
  }

  // =====================================================
  // GROUP: ADD / EDIT / SAVE
  // =====================================================

  openAddGroup(): void {
    this.clearGroupMessages();

    if (this.groupCmrcId == null) {
      this.groupError = 'CMRC is not available.';
      return;
    }

    if (this.groupVoAlfId == null) {
      this.groupError = 'Please select VO / ALF first.';
      return;
    }

    const voAlf = this.groupVoAlfList.find(
      item => Number(item.id) === Number(this.groupVoAlfId)
    );

    if (!voAlf) {
      this.groupError = 'Selected VO / ALF not found.';
      return;
    }

    this.isEditGroup = false;
    this.editingGroupId = null;

    this.newGroup = {
      cmrcId: this.groupCmrcId,
      voAlfId: this.groupVoAlfId,
      villageName: voAlf.villageName || '',
      groupName: '',
      cmrcName: this.groupCmrcName,
      voAlfName: voAlf.voAlfName || ''
    };

    this.showGroupForm = true;
  }

  editGroup(group: Group): void {
    this.clearGroupMessages();

    if (
      group.id == null ||
      Number(group.cmrcId) !== Number(this.groupCmrcId)
    ) {
      this.groupError = 'You are not authorized to edit this group.';
      return;
    }

    this.isEditGroup = true;
    this.editingGroupId = Number(group.id);
    this.groupVoAlfId = Number(group.voAlfId);

    const voAlf = this.groupVoAlfList.find(
      item => Number(item.id) === Number(group.voAlfId)
    );

    this.groupVoAlfName = voAlf?.voAlfName || group.voAlfName || '';
    this.groupVillageName = voAlf?.villageName || group.villageName || '';

    this.newGroup = {
      ...group,
      cmrcId: this.groupCmrcId ?? group.cmrcId,
      voAlfId: Number(group.voAlfId),
      villageName: this.groupVillageName,
      cmrcName: this.groupCmrcName,
      voAlfName: this.groupVoAlfName
    };

    // Align Members filters with the group being edited.
    this.memberCmrcId = this.groupCmrcId;
    this.memberVoAlfId = Number(group.voAlfId);
    this.memberGroupId = Number(group.id);

    this.showGroupForm = true;
  }

  closeGroupForm(): void {
    if (this.isSavingGroup) {
      return;
    }

    this.showGroupForm = false;
    this.isEditGroup = false;
    this.editingGroupId = null;
    this.newGroup = this.emptyGroup();
  }

  saveGroup(): void {
    this.clearGroupMessages();

    if (this.groupCmrcId == null || this.groupVoAlfId == null) {
      this.groupError = 'Please select CMRC and VO / ALF.';
      return;
    }

    const groupName = (this.newGroup.groupName || '').trim();

    const voAlf = this.groupVoAlfList.find(
      item => Number(item.id) === Number(this.groupVoAlfId)
    );

    if (!groupName) {
      this.groupError = 'Group Name is required.';
      return;
    }

    if (!voAlf) {
      this.groupError = 'Selected VO / ALF not found.';
      return;
    }

    if (this.isSavingGroup) {
      return;
    }

    const payload: Group = {
      ...this.newGroup,
      cmrcId: this.groupCmrcId,
      voAlfId: this.groupVoAlfId,
      villageName: voAlf.villageName || '',
      groupName,
      cmrcName: this.groupCmrcName,
      voAlfName: voAlf.voAlfName || ''
    };

    const wasEdit = this.isEditGroup;
    this.isSavingGroup = true;

    const request =
      wasEdit && this.editingGroupId != null
        ? this.groupService.update(this.editingGroupId, payload)
        : this.groupService.create(payload);

    request.subscribe({
      next: () => {
        this.isSavingGroup = false;
        this.showGroupForm = false;
        this.isEditGroup = false;
        this.editingGroupId = null;

        this.groupSuccess = wasEdit
          ? 'Group updated successfully.'
          : 'Group saved successfully.';

        this.loadGroups();

        if (this.memberVoAlfId != null) {
          this.loadMemberGroups();
        }
      },
      error: (error) => {
        console.error('Error saving group:', error);

        this.isSavingGroup = false;
        this.groupError = this.getErrorMessage(
          error,
          'Unable to save group.'
        );
      }
    });
  }

  deleteGroup(group: Group): void {
    this.clearGroupMessages();

    if (
      group.id == null ||
      Number(group.cmrcId) !== Number(this.groupCmrcId)
    ) {
      this.groupError = 'You are not authorized to delete this group.';
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete group "${group.groupName}"?`
      )
    ) {
      return;
    }

    this.deletingGroupId = Number(group.id);

    this.groupService.delete(Number(group.id)).subscribe({
      next: () => {
        this.deletingGroupId = null;
        this.groupSuccess = 'Group deleted successfully.';

        if (Number(this.memberGroupId) === Number(group.id)) {
          this.memberGroupId = null;
          this.memberGroupList = this.memberGroupList.filter(
            item => Number(item.id) !== Number(group.id)
          );
        }

        this.loadGroups();

        if (this.memberVoAlfId != null) {
          this.loadMemberGroups();
        }
      },
      error: (error) => {
        console.error('Error deleting group:', error);

        this.deletingGroupId = null;
        this.groupError = this.getErrorMessage(
          error,
          'Unable to delete group. It may be linked to members.'
        );
      }
    });
  }

  // =====================================================
  // MEMBERS: CMRC / VO-ALF / GROUP FILTERS
  // =====================================================

  onMemberCmrcChange(): void {
    this.memberVoAlfId = null;
    this.memberGroupId = null;
    this.memberGroupList = [];

    this.searchText = '';
    this.showMemberForm = false;
    this.clearMemberMessages();

    this.loadMemberVoAlf();
  }

  private loadMemberVoAlf(): void {
    if (this.memberCmrcId == null) {
      this.memberVoAlfList = [];
      this.memberGroupList = [];
      return;
    }

    this.voAlfService.getByCmrcId(this.memberCmrcId).subscribe({
      next: (data: VoAlf[]) => {
        this.memberVoAlfList = data || [];

        // Keep the selected VO/ALF only if it belongs to this CMRC.
        if (
          this.memberVoAlfId != null &&
          !this.memberVoAlfList.some(
            item => Number(item.id) === Number(this.memberVoAlfId)
          )
        ) {
          this.memberVoAlfId = null;
          this.memberGroupId = null;
          this.memberGroupList = [];
        }
      },
      error: (error) => {
        console.error('Error loading Members tab VO / ALF:', error);

        this.memberVoAlfList = [];
        this.memberError = 'Unable to load VO / ALF records.';
      }
    });
  }

  onMemberVoAlfChange(): void {
    this.memberGroupId = null;
    this.memberGroupList = [];

    this.searchText = '';
    this.showMemberForm = false;
    this.clearMemberMessages();

    if (this.memberVoAlfId == null) {
      return;
    }

    this.loadMemberGroups();
  }

  private loadMemberGroups(): void {
    if (this.memberVoAlfId == null) {
      this.memberGroupList = [];
      return;
    }

    const selectedVoAlfId = Number(this.memberVoAlfId);

    this.groupService.getByVoAlfId(selectedVoAlfId).subscribe({
      next: (data: Group[]) => {
        this.memberGroupList = data || [];

        // Clear a group selection if it no longer belongs to the VO/ALF.
        if (
          this.memberGroupId != null &&
          !this.memberGroupList.some(
            item => Number(item.id) === Number(this.memberGroupId)
          )
        ) {
          this.memberGroupId = null;
        }
      },
      error: (error) => {
        console.error('Error loading member groups:', error);

        this.memberGroupList = [];
        this.memberError = 'Unable to load groups.';
      }
    });
  }

  onMemberGroupChange(): void {
    this.searchText = '';
    this.showMemberForm = false;
    this.clearMemberMessages();
  }

  // =====================================================
  // MEMBERS: LOAD / FILTER
  // =====================================================

  loadAllWomen(): void {
    this.loadingMembers = true;

    this.womenService.getAll().subscribe({
      next: (data: Women[]) => {
        this.womenList = data || [];
        this.loadingMembers = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);

        this.womenList = [];
        this.loadingMembers = false;
        this.memberError = 'Unable to load members.';
      }
    });
  }

  get filteredWomenList(): Women[] {
    const search = (this.searchText || '').trim().toLowerCase();

    return this.womenList.filter(woman => {
      if (
        this.memberCmrcId != null &&
        Number(woman.cmrcId) !== Number(this.memberCmrcId)
      ) {
        return false;
      }

      if (
        this.memberVoAlfId != null &&
        Number(woman.voAlfId) !== Number(this.memberVoAlfId)
      ) {
        return false;
      }

      if (
        this.memberGroupId != null &&
        Number(woman.groupId) !== Number(this.memberGroupId)
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        woman.womanName,
        woman.husbandName,
        woman.mobileNo,
        woman.address,
        woman.groupName,
        woman.villageName
      ].some(value =>
        String(value || '').toLowerCase().includes(search)
      );
    });
  }

  get totalWomen(): number {
    return this.filteredWomenList.length;
  }

  get memberCmrcName(): string {
    return this.cmrcList.find(
      item => Number(item.id) === Number(this.memberCmrcId)
    )?.cmrcName || '-';
  }

  get selectedMemberVoAlf(): VoAlf | undefined {
    return this.memberVoAlfList.find(
      item => Number(item.id) === Number(this.memberVoAlfId)
    );
  }

  get memberVoAlfName(): string {
    return this.selectedMemberVoAlf?.voAlfName || '-';
  }

  get memberVillageName(): string {
    return this.selectedMemberVoAlf?.villageName || '-';
  }

  get selectedMemberGroupName(): string {
    return this.memberGroupList.find(
      item => Number(item.id) === Number(this.memberGroupId)
    )?.groupName || '-';
  }

  // =====================================================
  // MEMBERS: ADD / EDIT / SAVE
  // =====================================================

  openAddMember(): void {
    this.clearMemberMessages();

    if (this.memberCmrcId == null) {
      this.memberError = 'CMRC is not available.';
      return;
    }

    if (this.memberVoAlfId == null) {
      this.memberError = 'Please select VO / ALF first.';
      return;
    }

    if (this.memberGroupId == null) {
      this.memberError = 'Please select Group first.';
      return;
    }

    this.isEditMember = false;
    this.isSavingMember = false;

    this.newWomen = {
      groupId: this.memberGroupId,
      womanName: '',
      husbandName: '',
      mobileNo: '',
      address: '',
      status: 'ACTIVE'
    };

    this.showMemberForm = true;
  }

  editMember(woman: Women): void {
    this.clearMemberMessages();

    if (woman.id == null || woman.groupId == null) {
      this.memberError = 'Member or Group information is missing.';
      return;
    }

    this.isEditMember = true;
    this.isSavingMember = false;

    // Align all filters with the selected member.
    if (woman.cmrcId != null) {
      this.memberCmrcId = Number(woman.cmrcId);
    }

    if (woman.voAlfId != null) {
      this.memberVoAlfId = Number(woman.voAlfId);
    }

    this.memberGroupId = Number(woman.groupId);

    this.newWomen = {
      id: woman.id,
      groupId: Number(woman.groupId),
      womanName: woman.womanName || '',
      husbandName: woman.husbandName || '',
      mobileNo: woman.mobileNo || '',
      address: woman.address || '',
      status: woman.status || 'ACTIVE'
    };

    this.showMemberForm = true;
  }

  closeMemberForm(): void {
    if (this.isSavingMember) {
      return;
    }

    this.showMemberForm = false;
    this.isEditMember = false;

    this.newWomen = {
      groupId: this.memberGroupId ?? 0,
      womanName: '',
      husbandName: '',
      mobileNo: '',
      address: '',
      status: 'ACTIVE'
    };
  }

  saveMember(): void {
    this.clearMemberMessages();

    if (
      this.memberCmrcId == null ||
      this.memberVoAlfId == null ||
      this.memberGroupId == null
    ) {
      this.memberError = 'Please select CMRC, VO / ALF and Group.';
      return;
    }

    const womanName = (this.newWomen.womanName || '').trim();

    if (!womanName) {
      this.memberError = 'Please enter Woman Name.';
      return;
    }

    if (this.isSavingMember) {
      return;
    }

    const payload: Women = {
      ...this.newWomen,
      groupId: this.memberGroupId,
      womanName
    };

    const wasEdit = this.isEditMember;
    this.isSavingMember = true;

    const request =
      wasEdit && payload.id != null
        ? this.womenService.update(payload.id, payload)
        : this.womenService.create(payload);

    request.subscribe({
      next: () => {
        this.isSavingMember = false;
        this.showMemberForm = false;
        this.isEditMember = false;

        this.memberSuccess = wasEdit
          ? 'Member updated successfully.'
          : 'Member added successfully.';

        this.loadAllWomen();
      },
      error: (error) => {
        console.error('Error saving member:', error);

        this.isSavingMember = false;
        this.memberError = this.getErrorMessage(
          error,
          wasEdit
            ? 'Failed to update member.'
            : 'Failed to add member.'
        );
      }
    });
  }

  deleteMember(id: number): void {
    this.clearMemberMessages();

    if (!confirm('Are you sure you want to delete this member?')) {
      return;
    }

    this.deletingMemberId = id;

    this.womenService.delete(id).subscribe({
      next: () => {
        this.deletingMemberId = null;
        this.memberSuccess = 'Member deleted successfully.';
        this.loadAllWomen();
      },
      error: (error) => {
        console.error('Error deleting member:', error);

        this.deletingMemberId = null;
        this.memberError = this.getErrorMessage(
          error,
          'Failed to delete member.'
        );
      }
    });
  }
}
