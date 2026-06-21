import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveSuccess } from './save-success';

describe('SaveSuccess', () => {
  let component: SaveSuccess;
  let fixture: ComponentFixture<SaveSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveSuccess],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveSuccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
