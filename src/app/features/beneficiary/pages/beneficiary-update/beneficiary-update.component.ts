import { Component, inject, OnInit } from '@angular/core';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
@Component({
  selector: 'app-beneficiary-update',
  standalone: true,
  imports: [],
  styles: ``,
  templateUrl: './beneficiary-update.component.html'
})
export class BeneficiaryUpdateComponent implements OnInit {
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar beneficiario');
  }

}
