import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmrcBalanceComponent } from './cmrc-balance.component';

describe('CmrcBalanceComponent', () => {
  let component: CmrcBalanceComponent;
  let fixture: ComponentFixture<CmrcBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CmrcBalanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CmrcBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
