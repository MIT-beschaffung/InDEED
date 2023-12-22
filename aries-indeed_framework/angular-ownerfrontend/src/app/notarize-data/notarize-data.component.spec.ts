import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotarizeDataComponent } from './notarize-data.component';

describe('NotarizeDataComponent', () => {
  let component: NotarizeDataComponent;
  let fixture: ComponentFixture<NotarizeDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotarizeDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotarizeDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
