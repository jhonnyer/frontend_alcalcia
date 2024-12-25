import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
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

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent],
  templateUrl: './inventory-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent implements OnInit {
  private productosService = inject(ProductosService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);

  data = signal<IProducto[]>([]);

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
    this.pageTitleService.setCurrentPage('Lista de productos');
    this.getAll();
  }

  getAll() {
    this.productosService.getAll().subscribe({
      next: response => {
        this.data.set(response);
      },
      error: error => {
        console.error("Error al cargar productos:", error);
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
    console.log("Eliminar:", item.original);
  }

  update(item: Row<IProducto>) {
    console.log("List update:", item.original.idProducto);
    this.router.navigate(["inventory/update/", item.original.idProducto]);
  }
}
