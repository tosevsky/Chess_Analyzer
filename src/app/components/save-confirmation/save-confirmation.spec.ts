import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveConfirmation } from './save-confirmation';

describe('SaveConfirmation', () => {
  let component: SaveConfirmation;
  let fixture: ComponentFixture<SaveConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveConfirmation],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveConfirmation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
