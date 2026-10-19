import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs';
import { Component, computed, inject, Injector, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { Column, ColumnFiltersState, FlexRenderDirective, PaginationState, Row, RowSelectionState, SortingState, createAngularTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/angular-table';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';
import { defaultColumns } from './beneficiario-proyecto-columns-definitions';
import { IBeneficiarioProyecto } from '../../../../core/models/beneficiarioProyecto.model';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PdfBeneficiariosProyectoService } from '../../../../shared/components/pdf/pdf-beneficiarios-proyecto.service';


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
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  private beneficiarioProyectoService = inject(BeneficiarioProyectoService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  private pdfService = inject(PdfBeneficiariosProyectoService);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  isExportingPdf = false;
  loading = signal(true);
  data = signal<IBeneficiarioProyecto[]>([]);
  totalElements = signal(0);
  totalPages = signal(1);
  serverPageIndex = signal(0);
  serverPageSize = signal(5);
  selectedProjectId = signal<number | 'ALL'>('ALL');
  projectSearch = signal('');
  projectSuggestionsVisible = signal(false);
  projectOptions = computed(() => {
    const projects = new Map<number, string>();
    this.data().forEach(item => {
      if (item.idProyecto && item.nombreProyecto) projects.set(item.idProyecto, item.nombreProyecto);
    });
    return Array.from(projects.entries()).map(([idProyecto, nombreProyecto]) => ({ idProyecto, nombreProyecto }))
      .sort((a, b) => a.nombreProyecto.localeCompare(b.nombreProyecto) || a.idProyecto - b.idProyecto);
  });
  filteredProjectOptions = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    return this.projectOptions().filter(project => !query || this.normalizeSearchText(`${project.idProyecto} ${project.nombreProyecto}`).includes(query));
  });
  filteredData = computed(() => {
    return this.data();
  });

  public readonly sizePage = signal<number[]>([5, 10, 25, 50, 100]);
  public readonly rowSelectionState = signal<RowSelectionState>({});
  public copyOnClipboard = signal<number | null>(null);
  public readonly columnFilters = signal<ColumnFiltersState>([]);

  public readonly paginationState = signal<PaginationState>({ pageIndex: 0, pageSize: 1000 });

  public readonly sortingState = signal<SortingState>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Beneficiarios en Proyectos');
    this.getAll();
  }

  getAll() {
    this.loading.set(true);
    this.loadError.set('');
    this.beneficiarioProyectoService
      .getPaged(this.serverPageIndex(), this.serverPageSize(), this.buildPagedFilters())
      .pipe(timeout(45000), finalize(() => this.loading.set(false)))
      .subscribe({
      next: response => {
        this.data.set(response.content ?? []);
        this.totalElements.set(response.totalElements ?? response.content?.length ?? 0);
        this.totalPages.set(Math.max(1, response.totalPages ?? 1));
        this.loading.set(false);
      },
      error: error => {
        console.error("Error getAll beneficiarios-proyecto: ", error);
        this.loadError.set('No se pudieron cargar las asignaciones de beneficiarios. La consulta falló o tardó demasiado.');
        this.loading.set(false);
      }
    });
  }

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
    this.serverPageSize.set(+element.value);
    this.serverPageIndex.set(0);
    this.getAll();
  }

  previousServerPage(): void {
    if (this.serverPageIndex() <= 0 || this.loading()) return;
    this.serverPageIndex.update(v => v - 1);
    this.getAll();
  }

  nextServerPage(): void {
    if (this.serverPageIndex() >= this.totalPages() - 1 || this.loading()) return;
    this.serverPageIndex.update(v => v + 1);
    this.getAll();
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

  onProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.selectedProjectId.set('ALL');
    this.projectSuggestionsVisible.set(true);
    this.serverPageIndex.set(0);
    this.runDebouncedSearch();
  }

  selectProjectOption(project: { idProyecto: number; nombreProyecto: string }): void {
    this.selectedProjectId.set(project.idProyecto);
    this.projectSearch.set(`#${project.idProyecto} - ${project.nombreProyecto}`);
    this.projectSuggestionsVisible.set(false);
    this.serverPageIndex.set(0);
    this.getAll();
  }

  clearProjectFilter(): void {
    this.selectedProjectId.set('ALL');
    this.projectSearch.set('');
    this.projectSuggestionsVisible.set(false);
    this.serverPageIndex.set(0);
    this.getAll();
  }

  showProjectSuggestions(): void { this.projectSuggestionsVisible.set(true); }
  hideProjectSuggestions(): void { setTimeout(() => this.projectSuggestionsVisible.set(false), 150); }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
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

  private buildPagedFilters(): { idProyecto?: number; busqueda?: string } {
    const selectedProject = this.selectedProjectId();
    const search = this.projectSearch().trim();

    return {
      idProyecto: selectedProject === 'ALL' ? undefined : selectedProject,
      busqueda: selectedProject === 'ALL' && search ? search : undefined,
    };
  }

  delete(item: Row<IBeneficiarioProyecto>) {
    // Implementar lógica de eliminación
  }

  update(item: Row<IBeneficiarioProyecto>) {
    this.router.navigate(["/projects/add-beneficiary/update/", item.original.idBeneficiarioProyecto]);
  }
 
  sanitizeHtml(content: string): SafeHtml {
   return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  async exportarBeneficiariosPorProyecto() {
    if (this.isExportingPdf) return;
    const datosExportar = this.filteredData();
    if (!datosExportar || datosExportar.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    this.isExportingPdf = true;
    try {
      await this.pdfService.generarReporte(datosExportar);
    } catch (error) {
      console.error('Error al exportar beneficiarios por proyecto:', error);
    } finally {
      this.isExportingPdf = false;
    }
  }
}
