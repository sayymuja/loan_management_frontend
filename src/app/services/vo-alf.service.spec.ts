import { TestBed } from '@angular/core/testing';

import { VoAlfService } from './vo-alf.service';

describe('VoAlfService', () => {
  let service: VoAlfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoAlfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
