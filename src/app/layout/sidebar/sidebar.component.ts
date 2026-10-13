import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  constructor() { }
  isSuperAdmin =
  localStorage.getItem('role')?.replace(/^ROLE_/i, '').toUpperCase()
  === 'SUPER_ADMIN';

  ngOnInit(): void {
  }

}
