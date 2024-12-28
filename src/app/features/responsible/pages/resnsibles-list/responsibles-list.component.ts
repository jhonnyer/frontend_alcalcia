import { CommonModule } from '@angular/common';
import { Component, inject, Injector, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { ResponsibleService } from '../../../../core/services/responsible.service';
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
import { defaultColumns } from './responsibles-columns-definitions';
import { IResponsable } from '../../../../core/models/responsable.model';
// import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';

@Component({
  selector: 'app-responsibles-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent],
  templateUrl: './responsibles-list.component.html',
  styles: ``,
})
export class ResponsiblesListComponent {
  private responsibleService = inject(ResponsibleService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  data = signal<IResponsable[]>([]);

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
    this.pageTitleService.setCurrentPage('Lista de responsables');
    this.getAll();
  }

  getAll() {
    this.responsibleService.getAll().subscribe({
      next: response => {
        this.data.set(response);
      },
      error: error => {
        console.error("Error getAll responsables:", error);
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

  onSortingColumn(column: Column<IResponsable>) {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<IResponsable>) {
    this.copyOnClipboard.set(row.original.idResponsable);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'nombreCompleto', // Cambiado para buscar por nombre completo
        value: value,
      },
    ]);
  }

  delete(item: Row<IResponsable>) {
    this.responsibleService.delete(item.original.idResponsable.toString());
  }

  update(item: Row<IResponsable>) {
    this.router.navigate(["resposibles/update/", item.original.idResponsable]);
  }
}
