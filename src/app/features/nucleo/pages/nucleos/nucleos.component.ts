import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, Injector, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { Column, ColumnFiltersState, FlexRenderDirective, PaginationState, Row, RowSelectionState, SortingState, VisibilityState, createAngularTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/angular-table';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';
import { defaultColumns } from './nucleo-columns-definitions';
import { INucleoUpdate } from '../../../../core/models/nucleo.model';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';

@Component({
  selector: 'app-nucleos',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent, HasRoleDirective],
  templateUrl: './nucleos.component.html',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucleosComponent implements OnInit{
  private nucleoService = inject(NucleoService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  data = signal<INucleoUpdate[]>([]);

  public readonly sizePage = signal<number[]>([5, 10, 25, 50, 100]);
  public readonly rowSelectionState = signal<RowSelectionState>({});
  public copyOnClipboard = signal<number | null>(null);
  public readonly columnFilters = signal<ColumnFiltersState>([]);

  public readonly paginationState = signal<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  public readonly sortingState = signal<SortingState>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Núcleos familiares');
    this.getAll();
  }

  getAll() {
    this.nucleoService.getSimpleAll().subscribe({
      next: response => {
        this.data.set(response)
      },
      error: error => {
        console.log("Error getAll nucleos: ", error)
      }
    })
  }

  public dataTable = createAngularTable(() => ({
    data: this.data(),
    getCoreRowModel: getCoreRowModel(),
    columns: defaultColumns,

    //Paginación
    getPaginationRowModel: getPaginationRowModel(),

    // Ordenar filas
    getSortedRowModel: getSortedRowModel(),

    // Modelo de filtrado
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      pagination: this.paginationState(),
      sorting: this.sortingState(),
      rowSelection: this.rowSelectionState(), // Seleccion de filas
      columnFilters: this.columnFilters(), // Filtros de columnas
    },

    // Función paginación
    onPaginationChange: ( valueOrFunction ) => {
      typeof valueOrFunction === 'function'
      ? this.paginationState.update( valueOrFunction )
      : this.paginationState.set( valueOrFunction );
    },

    // Funcion ordnenar
    onSortingChange: ( valueSorting ) => {
      typeof valueSorting === 'function'
      ? this.sortingState.update( valueSorting )
      : this.sortingState.set( valueSorting );
    },

    // Selección de una fila recibe una función o un objeto
    onRowSelectionChange: (valueOrFunction) => {
      valueOrFunction instanceof Function
      ? this.rowSelectionState.update( valueOrFunction )
      : this.rowSelectionState.set( valueOrFunction );
    },

    // Manejador de cambios de filtros de columnas
    onColumnFiltersChange: updater => {
      updater instanceof Function
        ? this.columnFilters.update(updater)
        : this.columnFilters.set(updater);
    },
  }));


  // Cambio de numero de elementos por pagina
  onChangeValueSizePageSelect(e: Event){
    const element = (e.target as HTMLSelectElement);
    this.dataTable.setPageSize(+element.value);
  }

  //Ordenar filas de la tabla
  onSortingColumn(column: Column<INucleoUpdate>){
    column.toggleSorting(); // Por defecto
  }

  // Seleccionar una fila
  onCopyOnClipboard( row: Row<INucleoUpdate> ) {
    this.copyOnClipboard.set( row.original.idNucleo );
  }

  // Metodo de busqueda
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'name', // Inicialmente filtramos por la columna name
        value: value,
      },
    ]);
  }

  delete(item: Row<INucleoUpdate>){
    this.nucleoService.deleteById(item.original.idNucleo.toString());
    // console.log("Eliminar: ", item.original.idNucleo)
  }

  update(item: Row<INucleoUpdate>){
    this.router.navigate(["nucleo/update/", item.original.idNucleo]);
  }
}
