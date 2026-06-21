import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepertoireContent } from './repertoire-content';

describe('RepertoireContent', () => {
  let component: RepertoireContent;
  let fixture: ComponentFixture<RepertoireContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepertoireContent],
    }).compileComponents();

    fixture = TestBed.createComponent(RepertoireContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
