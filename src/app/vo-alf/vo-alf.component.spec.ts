import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoAlfComponent } from './vo-alf.component';

describe('VoAlfComponent', () => {
  let component: VoAlfComponent;
  let fixture: ComponentFixture<VoAlfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VoAlfComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VoAlfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
