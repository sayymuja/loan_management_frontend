import { TestBed } from '@angular/core/testing';

import { VoAlfFundService } from './vo-alf-fund.service';

describe('VoAlfFundService', () => {
  let service: VoAlfFundService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoAlfFundService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
