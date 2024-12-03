import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, OnInit, signal } from '@angular/core';

import { SearchService } from '../../../../core/services/search.service';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';

import { ProductosService } from '../../../../core/services/productos.service';

import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';
import { IProducto } from '../../../../core/models/products.model';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, TableTemplateComponent, StepperPaginationComponent],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit{
  private searchService = inject(SearchService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);

  currentPage = 0;
  data = signal<IProducto[]>([]);
  totalPage!: number;

  private productosService = inject(ProductosService);

  displayedColumns: (keyof IProducto | 'controls')[] = [
    'idProducto',
    'nombre',
    'descripcion',
    'stock',
    'fechaIngreso',
    'controls'
  ]

  columnSearch = 'idProyecto';

  sorteablesColumns: string[] = [
    'idProducto',
    'nombre',
    'descripcion',
    'stock',
    'fechaIngreso'
  ]

  stickyColumns = [
    "idProducto"
  ]

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Lista de productos');
    this.trackSearchTerm();
    this.getAll();
  }

  getAll() {
    this.productosService.getAll().subscribe({
      next: response => {
        this.data.set(response)
        console.log(response)
        this.totalPage = 1;
      },
      error: error => {
        console.log("Error getAll ineventarios: ", error)
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

  delete(item: IProducto){
    console.log("Eliminar: ", item)
  }

  update(item: IProducto){
    console.log("update/: ", item)
    // this.router.navigate(["nucleo/update/", item.idNucleo]);
  }


}
