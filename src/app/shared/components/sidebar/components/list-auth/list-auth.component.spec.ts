import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAuthComponent } from './list-auth.component';

describe('ListAuthComponent', () => {
  let component: ListAuthComponent;
  let fixture: ComponentFixture<ListAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
