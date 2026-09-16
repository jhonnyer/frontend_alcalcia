import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import {
  Column,
  ColumnFiltersState,
  FlexRenderDirective,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  createAngularTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/angular-table';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';
import { defaultColumns } from './inventory-columns-definitions';
import { IProducto } from '../../../../core/models/products.model';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule, 
    CdkTableModule, 
    FlexRenderDirective, 
    TableFilterComponent, 
    MatIconModule
  ],
  templateUrl: './inventory-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent implements OnInit {
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  private productosService = inject(ProductosService);
  private proyectosService = inject(ProyectosService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);
  filtroActual = '';

  data = signal<IProducto[]>([]);
  proyectos = signal<IProyectoAndCategoriaArray[]>([]);
  selectedProjectId = signal<number | null>(null);
  selectedCategoryId = signal<number | null>(null);
  selectedProject = signal<IProyectoAndCategoriaArray | null>(null);
  categories = signal<IProyectoAndCategoriaArray['categorias']>([]);

  // Estados para la tabla
  public readonly sizePage = signal<number[]>([5, 10, 25, 50, 100]);
  public readonly rowSelectionState = signal<RowSelectionState>({});
  public copyOnClipboard = signal<number | null>(null);
  public readonly columnFilters = signal<ColumnFiltersState>([]);

  public readonly paginationState = signal<PaginationState>({
    pageIndex: 0,
    pageSize: 5
  });

  public readonly sortingState = signal<SortingState>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Inventario');
    this.getAll();
  }

  getAll() {
    this.proyectosService.getAll().subscribe({
      next: response => {
        const proyectos = response.respuesta ?? [];
        this.proyectos.set(proyectos);
        if (proyectos.length === 1) {
          this.selectProject(proyectos[0].proyecto.idProyecto);
        }
      },
      error: error => {
        console.error("Error al cargar productos:", error);
      }
    });
  }

  selectProject(id: number | string | null): void {
    const projectId = id === null || id === '' ? null : Number(id);
    const project = this.proyectos().find(item => item.proyecto.idProyecto === projectId) ?? null;
    this.selectedProjectId.set(projectId);
    this.selectedProject.set(project);
    this.categories.set(project?.categorias ?? []);
    this.selectedCategoryId.set(null);
    this.data.set([]);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  selectCategory(id: number | string | null): void {
    const categoryId = id === null || id === '' ? null : Number(id);
    this.selectedCategoryId.set(categoryId);
    this.data.set([]);
    if (this.selectedProjectId() && categoryId) {
      this.productosService.getByProjectCategory(this.selectedProjectId()!, categoryId).subscribe({
        next: products => this.data.set(products),
        error: error => console.error('Error al cargar productos por proyecto y categoría:', error)
      });
    }
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  public dataTable = createAngularTable(() => ({
    data: this.data(),
    getCoreRowModel: getCoreRowModel(),
    columns: defaultColumns,

    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      pagination: this.paginationState(),
      sorting: this.sortingState(),
      rowSelection: this.rowSelectionState(),
      columnFilters: this.columnFilters(),
    },

    onPaginationChange: (valueOrFunction) => {
      typeof valueOrFunction === 'function'
        ? this.paginationState.update(valueOrFunction)
        : this.paginationState.set(valueOrFunction);
    },

    onSortingChange: (valueSorting) => {
      typeof valueSorting === 'function'
        ? this.sortingState.update(valueSorting)
        : this.sortingState.set(valueSorting);
    },

    onRowSelectionChange: (valueOrFunction) => {
      valueOrFunction instanceof Function
        ? this.rowSelectionState.update(valueOrFunction)
        : this.rowSelectionState.set(valueOrFunction);
    },

    onColumnFiltersChange: updater => {
      updater instanceof Function
        ? this.columnFilters.update(updater)
        : this.columnFilters.set(updater);
    },
  }));

  onChangeValueSizePageSelect(e: Event) {
    const element = (e.target as HTMLSelectElement);
    this.dataTable.setPageSize(+element.value);
  }

  onSortingColumn(column: Column<IProducto>) {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<IProducto>) {
    this.copyOnClipboard.set(row.original.idProducto);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'nombre', // Búsqueda por nombre del producto
        value: value,
      },
    ]);
  }

  delete(item: Row<IProducto>) {
    this.productosService.delete(item.original.idProducto.toString());
  }

  update(item: Row<IProducto>) {
    this.router.navigate(["inventory/update/", item.original.idProducto]);
  }

  sanitizeHtml(content: string): SafeHtml {
   return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
