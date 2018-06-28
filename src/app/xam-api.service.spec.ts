import { TestBed, inject } from '@angular/core/testing';

import { XamApiService } from './xam-api.service';

describe('XamApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [XamApiService]
    });
  });

  it('should be created', inject([XamApiService], (service: XamApiService) => {
    expect(service).toBeTruthy();
  }));
});
