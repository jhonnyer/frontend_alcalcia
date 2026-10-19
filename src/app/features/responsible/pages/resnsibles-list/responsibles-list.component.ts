import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs';
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
import { defaultColumns } from './responsibles-columns-definitions';
import { IResponsable } from '../../../../core/models/responsable.model';
import { MatIconModule } from '@angular/material/icon';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ResponsibleUpdateComponent } from '../responsible-update/responsible-update.component';
import { TableFilterToolbarComponent } from '../../../../shared/components/table-filter-toolbar/table-filter-toolbar.component';

@Component({
  selector: 'app-responsibles-list',
  standalone: true,
  imports: [
    TableFilterToolbarComponent,
    CommonModule, 
    CdkTableModule, 
    MatIconModule,
    TableFilterComponent,
    FlexRenderDirective,
    ResponsibleUpdateComponent,
  ],
  templateUrl: './responsibles-list.component.html',
  styleUrl: './responsibles-list.component.scss'
})
export class ResponsiblesListComponent {
  constructor(
    private sanitizer: DomSanitizer
  ) {}
  private responsibleService = inject(ResponsibleService);
  injector = inject(Injector);
  private pageTitleService = inject(PageTitleService);
  data = signal<IResponsable[]>([]);
  formModalOpen = signal(false);
  editingResponsableId = signal<number | null>(null);

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
    this.pageTitleService.setCurrentPage('Usuarios del sistema');
    this.getAll();
  }

  getAll() {
    this.listLoading.set(true);
    this.loadError.set('');
    this.responsibleService.getAll().pipe(
      timeout(45000), finalize(() => this.listLoading.set(false))
    ).subscribe({
      next: response => {
        this.data.set(response.filter(item => (item.perfilUsuario || '').toUpperCase() !== 'SUPERADMIN'));
      },
      error: error => {
        console.error("Error getAll responsables:", error);
        this.loadError.set('No se pudieron cargar los usuarios. La consulta falló o tardó demasiado.');
      }
    });
  }

  listLoading = signal(false);
  loadError = signal('');

  activeFilterCount(): number {
    return this.columnFilters().length;
  }

  clearAllFilters(): void {
    this.columnFilters.set([]);
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
    this.editingResponsableId.set(item.original.idResponsable);
    this.formModalOpen.set(true);
  }

  nuevoResponsable(): void {
    this.editingResponsableId.set(null);
    this.formModalOpen.set(true);
  }

  closeFormModal(): void {
    this.formModalOpen.set(false);
    this.editingResponsableId.set(null);
  }

  onFormSaved(): void {
    this.closeFormModal();
    this.getAll();
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
