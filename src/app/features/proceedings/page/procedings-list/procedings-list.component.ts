import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Injector, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { ActasService } from '../../../../core/services/actas.service';
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
import { defaultColumns } from './procedings-columns-definitions';
import { IActa } from '../../../../core/models/acta.model';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-procedings-list',
  standalone: true,
  imports: [
    CommonModule,
    CdkTableModule,
    FlexRenderDirective,
    TableFilterComponent,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './procedings-list.component.html',
  styles: ``
})
export class ProcedingsListComponent implements OnInit {

  constructor(private sanitizer: DomSanitizer) {}

  // 🔹 Inyecciones
  private actasService = inject(ActasService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  injector = inject(Injector);

  // 🔹 Estados reactivos
  loading = signal(true);
  data = signal<IActa[]>([]);
  selectedProjectId = signal<number | 'ALL'>('ALL');
  projectSearch = signal('');
  projectSuggestionsVisible = signal(false);
  projectOptions = computed(() => {
    const projects = new Map<number, string>();
    this.data().forEach(acta => {
      if (acta.proyecto?.idProyecto && acta.proyecto?.nombre) {
        projects.set(acta.proyecto.idProyecto, acta.proyecto.nombre);
      }
    });
    return Array.from(projects.entries())
      .map(([idProyecto, nombreProyecto]) => ({ idProyecto, nombreProyecto }))
      .sort((a, b) => a.nombreProyecto.localeCompare(b.nombreProyecto) || a.idProyecto - b.idProyecto);
  });
  filteredProjectOptions = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    return this.projectOptions().filter(project => {
      const text = this.normalizeSearchText(`${project.idProyecto} ${project.nombreProyecto}`);
      return !query || text.includes(query);
    });
  });
  filteredData = computed(() => {
    const selectedProjectId = this.selectedProjectId();
    const query = this.normalizeSearchText(this.projectSearch());
    return this.data().filter(acta => {
      const matchesSelected = selectedProjectId === 'ALL' || acta.proyecto?.idProyecto === selectedProjectId;
      const text = this.normalizeSearchText(`${acta.proyecto?.idProyecto ?? ''} ${acta.proyecto?.nombre ?? ''}`);
      const matchesSearch = selectedProjectId !== 'ALL' || !query || text.includes(query);
      return matchesSelected && matchesSearch;
    });
  });
  dataTable?: ReturnType<() => ReturnType<typeof createAngularTable<IActa>>>;

  // 🔹 Configuración de tabla
  readonly sizePage = signal<number[]>([5, 10, 25, 50, 100]);
  readonly rowSelectionState = signal<RowSelectionState>({});
  readonly columnFilters = signal<ColumnFiltersState>([]);
  readonly copyOnClipboard = signal<number | null>(null);

  readonly paginationState = signal<PaginationState>({
    pageIndex: 0,
    pageSize: 5
  });

  readonly sortingState = signal<SortingState>([]);

  // ============================================================
  // ✅ CICLO DE VIDA
  // ============================================================
  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Asignaciones');
    this.getAll();
  }

  // ============================================================
  // ✅ CARGAR DATOS
  // ============================================================
  getAll(): void {
    this.loading.set(true);
    this.actasService.getAll()
      .pipe(delay(150)) // pequeña pausa visual
      .subscribe({
        next: (response) => {
          const orderedResponse = [...response].sort((first, second) => {
            const firstReceived = first.estado === 'R' ? 0 : 1;
            const secondReceived = second.estado === 'R' ? 0 : 1;

            if (firstReceived !== secondReceived) {
              return firstReceived - secondReceived;
            }

            const firstDate = this.parseActaDate(first.fechaCreacion);
            const secondDate = this.parseActaDate(second.fechaCreacion);
            return secondDate - firstDate || second.idActa - first.idActa;
          });

          this.data.set(orderedResponse);

          // Crear tabla si no existe
          if (!this.dataTable) {
            this.dataTable = createAngularTable<IActa>(() => ({
              data: this.filteredData(),
              columns: defaultColumns,
              getCoreRowModel: getCoreRowModel(),
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
              onColumnFiltersChange: (updater) => {
                updater instanceof Function
                  ? this.columnFilters.update(updater)
                  : this.columnFilters.set(updater);
              },
            }));
          } else {
            // Si ya existe, solo actualizar los datos
            this.dataTable.setOptions(prev => ({
              ...prev,
              data: this.filteredData()
            }));
          }

          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error getAll actas:', error);
          this.loading.set(false);
        }
      });
  }

  private parseActaDate(value: string): number {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  // ============================================================
  // ✅ FUNCIONES AUXILIARES
  // ============================================================
  onChangeValueSizePageSelect(e: Event): void {
    const element = e.target as HTMLSelectElement;
    this.dataTable?.setPageSize(+element.value);
  }

  onSortingColumn(column: Column<IActa>): void {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<IActa>): void {
    this.copyOnClipboard.set(row.original.idActa);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable?.setColumnFilters([{ id: 'estado', value }]);
  }

  onProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.selectedProjectId.set('ALL');
    this.projectSuggestionsVisible.set(true);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
    this.refreshTableData();
  }

  selectProjectOption(project: { idProyecto: number; nombreProyecto: string }): void {
    this.selectedProjectId.set(project.idProyecto);
    this.projectSearch.set(`#${project.idProyecto} - ${project.nombreProyecto}`);
    this.projectSuggestionsVisible.set(false);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
    this.refreshTableData();
  }

  clearProjectFilter(): void {
    this.selectedProjectId.set('ALL');
    this.projectSearch.set('');
    this.projectSuggestionsVisible.set(false);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
    this.refreshTableData();
  }

  showProjectSuggestions(): void {
    this.projectSuggestionsVisible.set(true);
  }

  hideProjectSuggestions(): void {
    setTimeout(() => this.projectSuggestionsVisible.set(false), 150);
  }

  private refreshTableData(): void {
    this.dataTable?.setOptions(prev => ({
      ...prev,
      data: this.filteredData()
    }));
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim();
  }

  delete(item: Row<IActa>): void {
    this.actasService.deleteById(item.original.idActa.toString());
  }

  update(item: Row<IActa>): void {
    this.router.navigate(['proceedings/update/', item.original.idActa]);
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
