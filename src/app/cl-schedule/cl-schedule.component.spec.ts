import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClScheduleComponent } from './cl-schedule.component';

describe('ClScheduleComponent', () => {
  let component: ClScheduleComponent;
  let fixture: ComponentFixture<ClScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClScheduleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
