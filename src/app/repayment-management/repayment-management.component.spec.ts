import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepaymentManagementComponent } from './repayment-management.component';

describe('RepaymentManagementComponent', () => {
  let component: RepaymentManagementComponent;
  let fixture: ComponentFixture<RepaymentManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RepaymentManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepaymentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
