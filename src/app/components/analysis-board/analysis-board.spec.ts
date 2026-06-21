import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisBoard } from './analysis-board';

describe('AnalysisBoard', () => {
  let component: AnalysisBoard;
  let fixture: ComponentFixture<AnalysisBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisBoard],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
