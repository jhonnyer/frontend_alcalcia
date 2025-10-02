import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiarioModalComponent } from './beneficiario-modal.component';

describe('BeneficiarioModalComponent', () => {
  let component: BeneficiarioModalComponent;
  let fixture: ComponentFixture<BeneficiarioModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiarioModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiarioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
