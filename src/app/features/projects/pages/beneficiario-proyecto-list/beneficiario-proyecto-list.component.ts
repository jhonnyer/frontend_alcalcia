import { CommonModule } from '@angular/common';
import { Component, inject, Injector, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { Column, ColumnFiltersState, FlexRenderDirective, PaginationState, Row, RowSelectionState, SortingState, createAngularTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/angular-table';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';
import { defaultColumns } from './beneficiario-proyecto-columns-definitions';
import { IBeneficiarioProyecto } from '../../../../core/models/beneficiarioProyecto.model';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-beneficiario-proyecto-list',
  standalone: true,
  imports: [
    CommonModule, 
    CdkTableModule, 
    FlexRenderDirective, 
    TableFilterComponent, 
    MatIconModule
  ],
  templateUrl: './beneficiario-proyecto-list.component.html',
  styleUrl: './beneficiario-proyecto-list.component.scss'
})
export class BeneficiarioProyectoListComponent implements OnInit {
  private beneficiarioProyectoService = inject(BeneficiarioProyectoService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  data = signal<IBeneficiarioProyecto[]>([]);

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
    this.pageTitleService.setCurrentPage('Beneficiarios en Proyectos');
    this.getAll();
  }

  getAll() {
    this.beneficiarioProyectoService.getAll().subscribe({
      next: data => this.data.set(data),
      error: error => console.error("Error getAll beneficiarios-proyecto: ", error)
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
    onPaginationChange: valueOrFunction => {
      typeof valueOrFunction === 'function'
        ? this.paginationState.update(valueOrFunction)
        : this.paginationState.set(valueOrFunction);
    },
    onSortingChange: valueSorting => {
      typeof valueSorting === 'function'
        ? this.sortingState.update(valueSorting)
        : this.sortingState.set(valueSorting);
    },
    onRowSelectionChange: valueOrFunction => {
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

  onSortingColumn(column: Column<IBeneficiarioProyecto>) {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<IBeneficiarioProyecto>) {
    this.copyOnClipboard.set(row.original.idBeneficiarioProyecto);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'numDocumentoBeneficiario',
        value: value,
      },
    ]);
  }

  delete(item: Row<IBeneficiarioProyecto>) {
    // Implementar lógica de eliminación
  }

  update(item: Row<IBeneficiarioProyecto>) {
    this.router.navigate(["/projects/add-beneficiary/update/", item.original.idBeneficiarioProyecto]);
  }
}
