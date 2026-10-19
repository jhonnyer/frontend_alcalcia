import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs';
import { Component, computed, inject, Injector, OnInit, signal } from '@angular/core';
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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent, MatCardModule, MatIconModule, HasRoleDirective],
  templateUrl: './beneficiary-list.component.html',
  styles: ``,
})
export class BeneficiaryListComponent implements OnInit {
  constructor(
    private dialog: MatDialog, 
    private snackBar: MatSnackBar, 
    private sanitizer: DomSanitizer ) {}
  private beneficiaryService = inject(BeneficiaryService);
  injector = inject(Injector);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);
  private alert = inject(AlertService);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  data = signal<IBeneficiario[]>([]);
  totalElements = signal(0);
  totalPages = signal(1);
  serverPageIndex = signal(0);
  serverPageSize = signal(5);
  actorFilter = signal<number | 'ALL'>('ALL');
  actorSearch = signal('');
  actorSearchQuery = signal('');
  actorSuggestionsVisible = signal(false);
  actorOptions = computed(() => {
    const actors = new Map<number, { id: number; nombre: string; municipio: string; barrio: string; direccion: string }>();
    this.data().forEach(beneficiario => {
      if (beneficiario.idNucleoFk && !actors.has(beneficiario.idNucleoFk)) {
        actors.set(beneficiario.idNucleoFk, {
          id: beneficiario.idNucleoFk,
          nombre: beneficiario.nombreNucleo || 'Sin nombre',
          municipio: beneficiario.nombreMunicipio || 'Sin municipio',
          barrio: beneficiario.barrio || 'Sin barrio',
          direccion: beneficiario.direccionNucleo || 'Sin dirección'
        });
      }
    });
    return Array.from(actors.values()).sort((a, b) => a.nombre.localeCompare(b.nombre) || a.id - b.id);
  });
  filteredActorOptions = computed(() => {
    const query = this.actorSearchQuery().trim().toLocaleLowerCase();
    if (!query) return this.actorOptions();
    return this.actorOptions().filter(actor =>
      `${actor.id} ${actor.nombre} ${actor.municipio} ${actor.barrio} ${actor.direccion}`
        .toLocaleLowerCase()
        .includes(query)
    );
  });
  filteredData = computed(() => {
    return this.data();
  });

  public readonly sizePage = signal<number[]>([5, 10, 25, 50, 100]);
  public readonly rowSelectionState = signal<RowSelectionState>({});
  public copyOnClipboard = signal<number | null>(null);
  public readonly columnFilters = signal<ColumnFiltersState>([]);

  public readonly paginationState = signal<PaginationState>({
    pageIndex: 0,
    pageSize: 1000
  });

  public readonly sortingState = signal<SortingState>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Gestión de Beneficiarios');
    this.getAll();
  }
  

  getAll() {
    this.listLoading.set(true);
    this.loadError.set('');
    this.beneficiaryService.getPaged(this.serverPageIndex(), this.serverPageSize(), this.buildPagedFilters()).pipe(
      timeout(45000), finalize(() => this.listLoading.set(false))
    ).subscribe({
      next: (response) => {
        this.data.set(response.content ?? []);
        this.totalElements.set(response.totalElements ?? response.content?.length ?? 0);
        this.totalPages.set(Math.max(1, response.totalPages ?? 1));
      },
      error: error => {
        console.error("Error getAll Beneficiarios:", error);
        this.loadError.set('No se pudieron cargar los beneficiarios. La consulta falló o tardó demasiado.');
      }
    });
  }

  listLoading = signal(false);
  loadError = signal('');

  public dataTable = createAngularTable(() => ({
    data: this.filteredData(),
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
    this.serverPageSize.set(+element.value);
    this.serverPageIndex.set(0);
    this.getAll();
  }

  previousServerPage(): void {
    if (this.serverPageIndex() <= 0) return;
    this.serverPageIndex.update(v => v - 1);
    this.getAll();
  }

  nextServerPage(): void {
    if (this.serverPageIndex() >= this.totalPages() - 1) return;
    this.serverPageIndex.update(v => v + 1);
    this.getAll();
  }

  onActorFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.actorFilter.set(value === 'ALL' ? 'ALL' : Number(value));
    this.serverPageIndex.set(0);
    this.getAll();
  }

  onActorSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.actorSearch.set(value);
    this.actorSearchQuery.set(value);
    this.actorFilter.set('ALL');
    this.actorSuggestionsVisible.set(true);
    this.serverPageIndex.set(0);
    this.runDebouncedSearch();
  }

  showActorSuggestions(): void {
    this.actorSuggestionsVisible.set(true);
  }

  hideActorSuggestions(): void {
    setTimeout(() => this.actorSuggestionsVisible.set(false), 150);
  }

  selectActorSuggestion(actor: { id: number; nombre: string }): void {
    this.actorSearch.set(`#${actor.id} - ${actor.nombre}`);
    this.actorSearchQuery.set('');
    this.actorFilter.set(actor.id);
    this.actorSuggestionsVisible.set(false);
    this.serverPageIndex.set(0);
    this.getAll();
  }

  clearActorFilter(): void {
    this.actorSearch.set('');
    this.actorSearchQuery.set('');
    this.actorFilter.set('ALL');
    this.actorSuggestionsVisible.set(true);
    this.serverPageIndex.set(0);
    this.getAll();
  }

  private buildPagedFilters(): { idNucleoFk?: number; busqueda?: string } {
    const actor = this.actorFilter();
    const busqueda = this.actorSearchQuery().trim();

    return {
      idNucleoFk: actor === 'ALL' ? undefined : actor,
      busqueda: actor === 'ALL' && busqueda ? busqueda : undefined,
    };
  }

  private runDebouncedSearch(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.getAll();
      this.searchDebounceTimer = null;
    }, 250);
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

  viewActor(row: Row<IBeneficiario>): void {
    const idNucleo = row.original.idNucleoFk;
    if (idNucleo) {
      this.router.navigate(['/nucleo/detalle', idNucleo]);
    }
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

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
