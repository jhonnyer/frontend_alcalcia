import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, OnInit, signal } from '@angular/core';

import { SearchService } from '../../../../core/services/search.service';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';

import { ResponsibleService } from '../../../../core/services/responsible.service';

import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';
import { IResponsable } from '../../../../core/models/responsable.model';

@Component({
  selector: 'app-responsibles-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, TableTemplateComponent, StepperPaginationComponent],
  templateUrl: './responsibles-list.component.html',
  styles: ``,
})
export class ResponsiblesListComponent {
  private searchService = inject(SearchService);
  injector = inject(Injector);
  private router = inject(Router);


  currentPage = 0;
  data = signal<IResponsable[]>([]);
  totalPage!: number;

  private responsibleService = inject(ResponsibleService);

  displayedColumns: (keyof IResponsable | 'controls')[] = [
    'idResponsable',
    'primerNombre',
    'segundoNombre',
    'primerApellido',
    'segundoApellido',
    'cargo',
    'area',
    'telefono',
    'email',
    'tipoIdentificacion',
    'numeroIdentificacion',
    'usuario',
    'perfilUsuario',
    'estado',
    'controls'
  ]

  columnSearch = 'nombreNucleo';

  sorteablesColumns: string[] = [
    'idResponsable',
    'primerNombre',
    'segundoNombre',
    'primerApellido',
    'segundoApellido',
    'perfilUsuario',
    'estado',
  ]

  stickyColumns = [
    "idResponsable"
  ]

  ngOnInit(): void {
    this.trackSearchTerm();
    this.getAll();
  }

  getAll() {
    this.responsibleService.getAll().subscribe({
      next: response => {
        this.data.set(response)
        this.totalPage = 1;
      },
      error: error => {
        console.log("Error getAll nucleos: ", error)
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

  delete(item: IResponsable){
    console.log("Eliminar: ", item)
  }

  update(item: IResponsable){
    console.log("update/: ", item)
    // this.router.navigate(["nucleo/update/", item.idNucleo]);
  }


}
