import { TestBed } from '@angular/core/testing';

import { CmrcService } from './cmrc.service';

describe('CmrcService', () => {
  let service: CmrcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CmrcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
