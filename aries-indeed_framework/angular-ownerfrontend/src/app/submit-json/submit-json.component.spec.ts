import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitJsonComponent } from './submit-json.component';

describe('SubmitJsonComponent', () => {
  let component: SubmitJsonComponent;
  let fixture: ComponentFixture<SubmitJsonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmitJsonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitJsonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
