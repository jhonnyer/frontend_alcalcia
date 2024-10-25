import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleDetailComponent } from './people-detail.component';

describe('PeopleDetailComponent', () => {
  let component: PeopleDetailComponent;
  let fixture: ComponentFixture<PeopleDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeopleDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeopleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
