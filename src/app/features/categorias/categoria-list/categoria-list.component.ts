import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, OnInit, signal } from '@angular/core';

import { SearchService } from '../../../core/services/search.service';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';

import { CategoriasService } from '../../../core/services/categorias.service';

import { TableTemplateComponent } from '../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../shared/components/stepper-pagination/stepper-pagination.component';
import { ICategorias } from '../../../core/models/categorias.model';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, TableTemplateComponent, StepperPaginationComponent],
  styles: ``,
  templateUrl: './categoria-list.component.html',
})
export class CategoriaListComponent {
  private searchService = inject(SearchService);
  injector = inject(Injector);
  private router = inject(Router);


  currentPage = 0;
  data = signal<ICategorias[]>([]);
  totalPage!: number;

  private categoriasService = inject(CategoriasService);

  displayedColumns: (keyof ICategorias | 'controls')[] = [
    'idCategoria',
    'nombre',
    'descripcion',
    'controls'
  ]

  columnSearch = 'idProyecto';

  sorteablesColumns: string[] = [
    'idCategoria',
    'nombre',
    'descripcion'
  ]

  stickyColumns = [
    'idCategoria'
  ]

  ngOnInit(): void {
    this.trackSearchTerm();
    this.getAll();
  }

  getAll() {
    this.categoriasService.getAll().subscribe({
      next: response => {
        this.data.set(response);
        this.totalPage = 1;
      },
      error: error => {
        console.log("Error getAll proyectos: ", error)
      }
    })
  }

  nextPage() {
    this.currentPage++;
    this.getAll();
  }

  previousPage() {
    if (this.currentPage >= 0) {
      this.currentPage--;
      this.getAll();
    }
  }

  trackSearchTerm(){
    effect(()=> {
      const search = this.searchService.getSearchTerm()();
      // this.dataSource.searchData(search);
    }, {injector: this.injector})
  }

  delete(item: ICategorias){
    console.log("Eliminar: ", item)
  }

  update(item: ICategorias){
    // console.log("update/: ", item)
    this.router.navigate(["categorias/update/", item.idCategoria]);
  }
}
