import { TestBed } from '@angular/core/testing';

import { Chess } from './chess';

describe('Chess', () => {
  let service: Chess;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Chess);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
