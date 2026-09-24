import { TestBed } from '@angular/core/testing';

import { CmrcBalanceService } from './cmrc-balance.service';

describe('CmrcBalanceService', () => {
  let service: CmrcBalanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CmrcBalanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
