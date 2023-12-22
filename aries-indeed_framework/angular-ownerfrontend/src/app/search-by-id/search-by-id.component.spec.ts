import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchByIDComponent } from './search-by-id.component';

describe('SearchByIDComponent', () => {
  let component: SearchByIDComponent;
  let fixture: ComponentFixture<SearchByIDComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchByIDComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchByIDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
