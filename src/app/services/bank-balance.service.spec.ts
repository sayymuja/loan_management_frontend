import { TestBed } from '@angular/core/testing';

import { BankBalanceService } from './bank-balance.service';

describe('BankBalanceService', () => {
  let service: BankBalanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BankBalanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
