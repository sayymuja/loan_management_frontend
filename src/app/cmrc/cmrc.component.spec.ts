import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmrcComponent } from './cmrc.component';

describe('CmrcComponent', () => {
  let component: CmrcComponent;
  let fixture: ComponentFixture<CmrcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CmrcComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CmrcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
