import { TestBed } from '@angular/core/testing';

import { ClScheduleService } from './cl-schedule.service';

describe('ClScheduleService', () => {
  let service: ClScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClScheduleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
