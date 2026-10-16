import { TestBed } from '@angular/core/testing';

import { FundManagementService } from './fund-management.service';

describe('FundManagementService', () => {
  let service: FundManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FundManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
