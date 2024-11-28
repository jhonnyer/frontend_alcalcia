import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, OnInit, signal } from '@angular/core';

import { SearchService } from '../../../../core/services/search.service';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';

import { ProyectosService } from '../../../../core/services/proyectos.service';

import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';
import { IProyecto } from '../../../../core/models/proyecto.model';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, TableTemplateComponent, StepperPaginationComponent],
  templateUrl: './projects-list.component.html',
  styles: ``
})
export class ProjectsListComponent {
  private searchService = inject(SearchService);
  injector = inject(Injector);
  private router = inject(Router);


  currentPage = 0;
  data = signal<IProyecto[]>([]);
  totalPage!: number;

  private proyectosService = inject(ProyectosService);

  displayedColumns: (keyof IProyecto | 'controls')[] = [
    'idProyecto',
    'nombre',
    'descripcion',
    'estado',
    'fechaInicio',
    'fechaFin',
    'tipoProyecto',
    'controls'
  ]

  columnSearch = 'idProyecto';

  sorteablesColumns: string[] = [
    'idProyecto',
    'nombre',
    'estado',
    'fechaInicio',
    'fechaFin',
    'tipoProyecto'
  ]

  stickyColumns = [
    "idProyecto"
  ]

  ngOnInit(): void {
    this.trackSearchTerm();
    this.getAll();
  }

  getAll() {
    this.proyectosService.getAll().subscribe({
      next: response => {
        this.data.set(response.respuesta)
        console.log(response)
        this.totalPage = 1;
      },
      error: error => {
        console.log("Error getAll proyectos: ", error)
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

  delete(item: IProyecto){
    console.log("Eliminar: ", item)
  }

  update(item: IProyecto){
    console.log("update/: ", item)
    // this.router.navigate(["nucleo/update/", item.idNucleo]);
  }
}
