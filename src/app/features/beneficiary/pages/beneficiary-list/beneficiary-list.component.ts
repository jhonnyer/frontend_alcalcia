import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, OnInit, signal } from '@angular/core';

import { IBeneficiario } from '../../../../core/models/beneficiary.models';
import { beneficiaryList } from '../../../../core/data/beneficiary.data';
import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';

import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { Router } from '@angular/router';
import { SearchService } from '../../../../core/services/search.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [
    CommonModule, TableTemplateComponent, StepperPaginationComponent
],
  templateUrl: './beneficiary-list.component.html',
  styles: ``,
})
export class BeneficiaryListComponent implements OnInit {
  private searchService = inject(SearchService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);

  currentPage = 0;
  data = signal<IBeneficiario[]>([]);
  totalPage!: number;

  private readonly beneficiaryService = inject(BeneficiaryService)

  displayedColumns: (keyof IBeneficiario | 'controls')[] = [
    'idBeneficiario',
    'idNucleoFk',
    'primerNombre',
    'segundoNombre',
    'primerApellido',
    'segundoApellido',
    'sexo',
    'genero',
    'etnia',
    'edad',
    'victimaConflicto',
    'tipoDocumento',
    'numeroDocumento',
    'fechaNacimiento',
    'telefono',
    'email',
    'controls'
  ]

  columnSearch = 'numeroDocumento';

  sorteablesColumns: string[] = [
    'idBeneficiario',
    'idNucleoFk',
    'primerNombre',
    'segundoNombre',
    'primerApellido',
    'segundoApellido',
    'numeroDocumento',
    'fechaNacimiento',
  ]

  stickyColumns = [
    "idBeneficiario"
  ]

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Beneficiarios');
    this.trackSearchTerm();
    this.getAll();
  }

  getAll() {
    this.beneficiaryService.getAll().subscribe({
      next: (response:IBeneficiario[]) => {
        this.data.set(response)
        this.totalPage = 1;
      },
      error: error => {
        console.log("Error getAll Beneficiarios: ", error);
      }
    })
  }

  nextPage() {
    this.currentPage++;
    console.log("Siguiente: ", this.currentPage)
    this.getAll();
  }

  previousPage() {
    if (this.currentPage >= 0) {
      this.currentPage--;
      console.log("previo: ", this.currentPage)
      this.getAll();
    }
  }

  trackSearchTerm(){
    effect(()=> {
      const search = this.searchService.getSearchTerm()();
      // this.dataSource.searchData(search);
    }, {injector: this.injector})
  }

  delete(item: IBeneficiario){
    console.log("Eliminar: ", item)
  }

  update(item: IBeneficiario){
    console.log("update/: ", item)
    this.router.navigate(["/beneficary/update/", item.idBeneficiario]);
    // this.router.navigate(["nucleo/update/", item.idNucleoFk]);
  }

}
