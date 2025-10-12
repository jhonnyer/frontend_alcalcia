import { CommonModule } from '@angular/common';
import { Component, inject, Injector, OnInit, signal } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { ConfirmDeleteDialogComponent } from '../../../nucleo/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BeneficiaryUpdateComponent } from '../beneficiary-update/beneficiary-update.component';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent, MatCardModule, MatIconModule, HasRoleDirective],
  templateUrl: './beneficiary-list.component.html',
  styles: ``,
})
export class BeneficiaryListComponent implements OnInit {
  constructor(private dialog: MatDialog, private snackBar: MatSnackBar ) {}
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
    pageSize: 5
  });

  public readonly sortingState = signal<SortingState>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Gestión de Beneficiarios');
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

  update(row: Row<IBeneficiario>) {
    const beneficiario = row.original;
    const dialogRef = this.dialog.open(BeneficiaryUpdateComponent, {
      width: '70%',
      maxWidth: '90vw',
      height: '90vh',
      data: { id: beneficiario.idBeneficiario } // pasae el id al modal
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated') { // El modal devuelve esta marca
        this.getAll();            // Refresca la tabla
      }
    });
  }


  delete(row: Row<IBeneficiario>) {
    const beneficiario = row.original;

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '350px',
      data: { mensaje: `¿Estás seguro de eliminar a "${beneficiario.primerNombre} ${beneficiario.primerApellido}"?` }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;

      this.beneficiaryService.delete(beneficiario.idBeneficiario.toString()).subscribe({
        next: () => {
          this.snackBar.open('✅ Beneficiario eliminado correctamente.', 'Cerrar', { duration: 3000 });
          this.getAll(); // refrescar tabla
        },
        error: (err) => {
          console.error('Error eliminando beneficiario:', err);
          this.snackBar.open('❌ Error al eliminar beneficiario.', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }

}
