import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { CategoriasService } from '../../../core/services/categorias.service';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { PageTitleService } from '../../../core/services/pageTitle.service';
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
import { TableFilterComponent } from '../../../shared/components/table-filter/table-filter.component';
import { defaultColumns } from './categorias-columns-definitions';
import { ICategorias } from '../../../core/models/categorias.model';
import { IProyectoAndCategoriaArray } from '../../../core/models/proyecto.model';
import { CategoriasCreateComponent } from '../categorias-create/categorias-create.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from '../../../core/services/alert.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TableFilterToolbarComponent } from '../../../shared/components/table-filter-toolbar/table-filter-toolbar.component';
import { ServerPaginationComponent } from '../../../shared/components/server-pagination/server-pagination.component';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    TableFilterToolbarComponent,
    ServerPaginationComponent,
    CommonModule, 
    CdkTableModule, 
    FlexRenderDirective, 
    TableFilterComponent,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './categoria-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriaListComponent implements OnInit, OnChanges {
  @Input() inventoryProjects: IProyectoAndCategoriaArray[] | null = null;
  @Input() projectId: number | null = null;
  @Output() inventoryChanged = new EventEmitter<void>();
  @Output() productsRequested = new EventEmitter<{ idProyecto: number; idCategoria: number }>();
  constructor(
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {}
  private categoriasService = inject(CategoriasService);
  private proyectosService = inject(ProyectosService);
  private pageTitleService = inject(PageTitleService);
  private alert = inject(AlertService);
  private router = inject(Router);

  data = signal<Array<ICategorias & { idProyecto?: number; nombreProyecto?: string; cantidadProductos?: number }>>([]);
  selectedProjectId = signal<number | 'ALL'>('ALL');
  projectSearch = signal('');
  projectSuggestionsVisible = signal(false);
  projectOptions = computed(() => {
    const projects = new Map<number, string>();
    this.data().forEach(categoria => {
      if (categoria.idProyecto && categoria.nombreProyecto) {
        projects.set(categoria.idProyecto, categoria.nombreProyecto);
      }
    });
    return Array.from(projects.entries())
      .map(([idProyecto, nombreProyecto]) => ({ idProyecto, nombreProyecto }))
      .sort((a, b) => a.nombreProyecto.localeCompare(b.nombreProyecto) || a.idProyecto - b.idProyecto);
  });
  filteredData = computed(() => {
    const selectedProjectId = this.selectedProjectId();
    const query = this.normalizeSearchText(this.projectSearch());
    return this.data().filter(categoria => {
      const matchesSelectedProject = selectedProjectId === 'ALL' || categoria.idProyecto === selectedProjectId;
      const projectText = this.normalizeSearchText(`${categoria.idProyecto ?? ''} ${categoria.nombreProyecto ?? ''}`);
      const matchesProjectSearch = selectedProjectId !== 'ALL' || !query || projectText.includes(query);
      return matchesSelectedProject && matchesProjectSearch;
    });
  });
  filteredProjectOptions = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    return this.projectOptions().filter(project => {
      const text = this.normalizeSearchText(`${project.idProyecto} ${project.nombreProyecto}`);
      return !query || text.includes(query);
    });
  });

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
    if (this.inventoryProjects === null) {
      this.pageTitleService.setCurrentPage('Lista de categorías');
      this.getAll();
    }
  }

  ngOnChanges(): void {
    if (this.inventoryProjects !== null) {
      this.setProjects(this.inventoryProjects.filter(item =>
        this.projectId === null || item.proyecto.idProyecto === this.projectId
      ));
      this.clearProjectFilter();
    }
  }

  private setProjects(projects: IProyectoAndCategoriaArray[]): void {
    this.data.set(projects.flatMap(item =>
      (item.categorias ?? []).map(categoria => ({
        ...categoria,
        idProyecto: item.proyecto.idProyecto,
        nombreProyecto: item.proyecto.nombre,
        cantidadProductos: categoria.productos?.length ?? 0
      }))
    ));
  }

  getAll() {
    if (this.inventoryProjects !== null) {
      this.inventoryChanged.emit();
      return;
    }
    this.listLoading.set(true);
    this.loadError.set('');
    this.proyectosService.getAll().pipe(finalize(() => this.listLoading.set(false))).subscribe({
      next: response => {
        this.setProjects(response.respuesta ?? []);
      },
      error: error => {
        console.error("Error al cargar categorías:", error);
        this.loadError.set('No se pudieron cargar las categorías. La consulta falló o tardó demasiado.');
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
    this.dataTable.setPageSize(+element.value);
  }

  onProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.projectSuggestionsVisible.set(true);
    this.selectedProjectId.set('ALL');
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  selectProjectOption(project: { idProyecto: number; nombreProyecto: string }): void {
    this.selectedProjectId.set(project.idProyecto);
    this.projectSearch.set(`#${project.idProyecto} - ${project.nombreProyecto}`);
    this.projectSuggestionsVisible.set(false);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  clearProjectFilter(): void {
    this.selectedProjectId.set('ALL');
    this.projectSearch.set('');
    this.projectSuggestionsVisible.set(false);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  activeFilterCount(): number {
    return this.columnFilters().length
      + (this.selectedProjectId() !== 'ALL' || this.projectSearch().trim() ? 1 : 0);
  }

  clearAllFilters(): void {
    this.columnFilters.set([]);
    this.clearProjectFilter();
  }

  showProjectSuggestions(): void {
    this.projectSuggestionsVisible.set(true);
  }

  hideProjectSuggestions(): void {
    setTimeout(() => this.projectSuggestionsVisible.set(false), 150);
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }

  onSortingColumn(column: Column<ICategorias>) {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<ICategorias>) {
    this.copyOnClipboard.set(row.original.idCategoria);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'nombre',
        value: value,
      },
    ]);
  }

  delete(item: Row<ICategorias>): void {
    const categoria = item.original;

    // 1️⃣ Consultar la categoría completa desde el backend
    this.categoriasService.getById(categoria.idCategoria.toString()).subscribe({
      next: (categoriaCompleta) => {
        const tieneProductos =
          Array.isArray(categoriaCompleta.productos) &&
          categoriaCompleta.productos.length > 0;

        if (tieneProductos) {
          this.alert.warning('Alerta',`⚠️ No se puede eliminar la categoría "${categoriaCompleta.nombre}" porque tiene productos asociados.`);
          return;
        }

        // 2️⃣ Si no tiene productos, abrir confirmación
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: { mensaje: `¿Deseas eliminar la categoría "${categoriaCompleta.nombre}"?` },
          disableClose: true,
        });

        dialogRef.afterClosed().subscribe((confirmado) => {
          if (confirmado) {
            this.categoriasService.delete(categoriaCompleta.idCategoria.toString()).subscribe({
              next: () => {
                this.alert.success('Operación Exitosa','✅ Categoría eliminada correctamente');
                this.getAll(); // Recarga la lista
              },
              error: (error) => {
                console.error('❌ Error al eliminar categoría:', error);
                this.alert.error('Operación Fallida','⚠️ No se pudo eliminar la categoría. Intenta nuevamente.');
              },
            });
          }
        });
      },
      error: (error) => {
        console.error('❌ Error al obtener la categoría:', error);
        this.alert.error('Sin Datos ','⚠️ No se pudo obtener la información de la categoría.');
      },
    });
  }

  abrirDialogEditarCategoria(categoria: ICategorias & { idProyecto?: number }): void {
    const dialogRef = this.dialog.open(CategoriasCreateComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 32px)',
      data: { 
        modo: 'editar',
        categoria,
        idProyecto: categoria.idProyecto
      },
      disableClose: true,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (this.inventoryProjects !== null) this.pageTitleService.setCurrentPage('Inventario');
      if (resultado) {
        this.getAll();
      }
    });
  }

  abrirProyecto(idProyecto: number): void {
    this.router.navigate(['/projects/update', idProyecto]);
  }

  abrirProductos(idProyecto: number, idCategoria: number): void {
    this.productsRequested.emit({ idProyecto, idCategoria });
  }

  sanitizeHtml(content: string): SafeHtml {
      return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
