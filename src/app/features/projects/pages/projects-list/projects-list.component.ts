import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Injector, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
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
import { defaultColumns } from './projects-columns-definitions';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent, HasRoleDirective],
  templateUrl: './projects-list.component.html',
  styles: ``
})
export class ProjectsListComponent {
  private proyectosService = inject(ProyectosService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);

  // Cambiamos el tipo del signal para manejar el objeto completo
  data = signal<IProyectoAndCategoriaArray[]>([]);

  // Estados para la tabla
  public readonly sizePage = signal<number[]>([5, 10, 25, 50, 100]);
  public readonly rowSelectionState = signal<RowSelectionState>({});
  public copyOnClipboard = signal<number | null>(null);
  public readonly columnFilters = signal<ColumnFiltersState>([]);

  public readonly paginationState = signal<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  public readonly sortingState = signal<SortingState>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Proyectos');
    this.getAll();
  }

  getAll() {
    this.proyectosService.getAll().subscribe({
      next: response => {
        if (response.estado === 'exito') {
          // Guardamos la respuesta completa para tener acceso a proyectos y categorías
          this.data.set(response.respuesta);
        }
      },
      error: error => {
        console.error("Error al cargar proyectos:", error);
      }
    });
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

  onSortingColumn(column: Column<IProyectoAndCategoriaArray>) {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<IProyectoAndCategoriaArray>) {
    this.copyOnClipboard.set(row.original.proyecto.idProyecto);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'nombre',
        value: value,
      },
    ]);
  }

  delete(item: Row<IProyectoAndCategoriaArray>) {
    this.proyectosService.delete(item.original.proyecto.idProyecto); // Eliminar proyecto
  }

  update(item: Row<IProyectoAndCategoriaArray>) {
    this.router.navigate(["projects/update/", item.original.proyecto.idProyecto]);
  }
}
