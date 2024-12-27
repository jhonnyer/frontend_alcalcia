import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Injector, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
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
import { defaultColumns } from './beneficiary-columns-definitions';
import { IBeneficiario } from '../../../../core/models/beneficiary.models';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent],
  templateUrl: './beneficiary-list.component.html',
  styles: ``,
})
export class BeneficiaryListComponent implements OnInit {
  private beneficiaryService = inject(BeneficiaryService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  data = signal<IBeneficiario[]>([]);

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
    this.pageTitleService.setCurrentPage('Beneficiarios');
    this.getAll();
  }

  getAll() {
    this.beneficiaryService.getAll().subscribe({
      next: (response) => {
        this.data.set(response);
      },
      error: error => {
        console.error("Error getAll Beneficiarios:", error);
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

  onSortingColumn(column: Column<IBeneficiario>) {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<IBeneficiario>) {
    this.copyOnClipboard.set(row.original.idBeneficiario);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'primerNombre',
        value: value,
      },
    ]);
  }

  delete(item: Row<IBeneficiario>) {
    //console.log("Delete Beneficiario:", item.original);
    // this.beneficiaryService.delete(item.original.idBeneficiario);
  }

  update(item: Row<IBeneficiario>) {
    this.router.navigate(["/beneficary/update/", item.original.idBeneficiario]);
  }

}
