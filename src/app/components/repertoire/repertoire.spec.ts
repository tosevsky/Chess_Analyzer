import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Repertoire } from './repertoire';

describe('Repertoire', () => {
  let component: Repertoire;
  let fixture: ComponentFixture<Repertoire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Repertoire],
    }).compileComponents();

    fixture = TestBed.createComponent(Repertoire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
