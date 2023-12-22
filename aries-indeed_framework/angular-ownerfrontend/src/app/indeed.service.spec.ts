import { TestBed } from '@angular/core/testing';

import { IndeedService } from './indeed.service';

describe('IndeedService', () => {
  let service: IndeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
