import { CommonModule } from '@angular/common';
import { finalize, Subscription, timeout } from 'rxjs';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkTableModule } from '@angular/cdk/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
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
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ICategorias } from '../../../../core/models/categorias.model';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoriaListComponent } from '../../../categorias/categoria-list/categoria-list.component';
import { CategoriasCreateComponent } from '../../../categorias/categorias-create/categorias-create.component';
import { InventoryCreateComponent, InventoryCreateDialogData } from '../inventory-create/inventory-create.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertService } from '../../../../core/services/alert.service';
import { TableFilterToolbarComponent } from '../../../../shared/components/table-filter-toolbar/table-filter-toolbar.component';
import { ServerPaginationComponent } from '../../../../shared/components/server-pagination/server-pagination.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    TableFilterToolbarComponent,
    ServerPaginationComponent,
    CommonModule, 
    CdkTableModule, 
    FlexRenderDirective, 
    TableFilterComponent, 
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    CategoriaListComponent
  ],
  templateUrl: './inventory-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent implements OnInit {
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  private productosService = inject(ProductosService);
  private proyectosService = inject(ProyectosService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);
  private dialog = inject(MatDialog);
  activeTab = signal(0);
  private projectsLoaded = false;
  filtroActual = '';

  data = signal<IProducto[]>([]);
  proyectos = signal<IProyectoAndCategoriaArray[]>([]);
  selectedProjectId = signal<number | null>(null);
  selectedCategoryId = signal<number | null>(null);
  selectedProject = signal<IProyectoAndCategoriaArray | null>(null);
  categories = signal<IProyectoAndCategoriaArray['categorias']>([]);
  projectSearch = signal('');
  categorySearch = signal('');
  projectSuggestionsVisible = signal(false);
  categorySuggestionsVisible = signal(false);
  filteredProjects = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    return this.proyectos().filter(item => {
      const text = this.normalizeSearchText(`${item.proyecto.idProyecto} ${item.proyecto.nombre}`);
      return !query || text.includes(query);
    });
  });
  filteredCategories = computed(() => {
    const query = this.normalizeSearchText(this.categorySearch());
    return this.categories().filter(category => {
      const text = this.normalizeSearchText(`${category.idCategoria} ${category.nombre} ${category.descripcion}`);
      return !query || text.includes(query);
    });
  });
  private initialProjectId: number | null = null;
  private initialCategoryId: number | null = null;

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
    this.pageTitleService.setCurrentPage('Inventario');
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.initialProjectId = Number(params.get('idProyecto')) || null;
      this.initialCategoryId = Number(params.get('idCategoria')) || null;
      this.activeTab.set(params.get('vista') === 'categorias' ? 1 : 0);
      if (this.projectsLoaded) this.applyContext();
    });
    this.getAll();
  }

  private applyContext(refresh = false, autoSelect = false): void {
    const projectId = this.initialProjectId
      ?? (autoSelect && this.proyectos().length === 1 ? this.proyectos()[0].proyecto.idProyecto : null);
    const project = this.proyectos().find(item => item.proyecto.idProyecto === projectId);
    const category = project?.categorias.find(item => item.idCategoria === this.initialCategoryId);
    if (this.initialProjectId && !project) {
      this.alert.warning('Proyecto no disponible', 'El proyecto solicitado no está disponible en el inventario de esta secretaría.');
    } else if (this.initialCategoryId && !category) {
      this.alert.warning('Categoría no disponible', 'La categoría solicitada no pertenece al proyecto seleccionado o ya no está disponible.');
    }
    if (refresh || this.selectedProjectId() !== (project?.proyecto.idProyecto ?? null)) {
      this.selectProject(project?.proyecto.idProyecto ?? null, false);
      this.selectCategory(category?.idCategoria ?? null, false);
    } else if (this.selectedCategoryId() !== (category?.idCategoria ?? null)) {
      this.selectCategory(category?.idCategoria ?? null, false);
    }
    this.syncContext();
  }

  private syncContext(): void {
    const idProyecto = this.selectedProjectId();
    const idCategoria = this.selectedCategoryId();
    const vista = this.activeTab() === 1 ? 'categorias' : null;
    const params = this.route.snapshot.queryParamMap;
    if (params.get('idProyecto') === (idProyecto === null ? null : String(idProyecto))
      && params.get('idCategoria') === (idCategoria === null ? null : String(idCategoria))
      && params.get('vista') === vista) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { idProyecto, idCategoria, vista },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  selectTab(index: number): void {
    this.activeTab.set(index);
    this.syncContext();
  }

  openCategoryProducts(context: { idProyecto: number; idCategoria: number }): void {
    this.selectProject(context.idProyecto, false);
    this.selectCategory(context.idCategoria, false);
    this.selectTab(0);
  }

  createCategory(): void {
    const idProyecto = this.selectedProjectId();
    if (!idProyecto) {
      this.alert.warning('Selecciona un proyecto', 'Selecciona el proyecto al que pertenecerá la nueva categoría.');
      return;
    }
    this.dialog.open(CategoriasCreateComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 32px)',
      data: { idProyecto },
      autoFocus: false
    }).afterClosed().subscribe(result => {
      this.pageTitleService.setCurrentPage('Inventario');
      if (result) this.getAll();
    });
  }

  getAll() {
    this.productsRequest?.unsubscribe();
    this.data.set([]);
    this.listLoading.set(true);
    this.loadError.set('');
    this.proyectosService.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.listLoading.set(false))
    ).subscribe({
      next: response => {
        const proyectos = response.respuesta ?? [];
        this.proyectos.set(proyectos);
        const firstLoad = !this.projectsLoaded;
        this.projectsLoaded = true;
        this.applyContext(true, firstLoad);
      },
      error: error => {
        console.error("Error al cargar productos:", error);
        this.loadError.set('No se pudieron cargar los proyectos del inventario. La consulta falló o tardó demasiado.');
      }
    });
  }

  listLoading = signal(false);
  private destroyRef = inject(DestroyRef);
  private productsRequest?: Subscription;
  loadError = signal('');
  productsLoading = signal(false);
  productsError = signal('');

  selectProject(id: number | string | null, sync = true): void {
    this.productsRequest?.unsubscribe();
    const projectId = id === null || id === '' ? null : Number(id);
    const project = this.proyectos().find(item => item.proyecto.idProyecto === projectId) ?? null;
    this.selectedProjectId.set(project?.proyecto.idProyecto ?? null);
    this.selectedProject.set(project);
    this.categories.set(project?.categorias ?? []);
    this.selectedCategoryId.set(null);
    this.projectSearch.set(project ? `#${project.proyecto.idProyecto} - ${project.proyecto.nombre}` : '');
    this.categorySearch.set('');
    this.projectSuggestionsVisible.set(false);
    this.data.set([]);
    this.productsError.set('');
    this.columnFilters.set([]);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
    if (sync) this.syncContext();
  }

  selectCategory(id: number | string | null, sync = true): void {
    this.productsRequest?.unsubscribe();
    const categoryId = id === null || id === '' ? null : Number(id);
    const category = this.categories().find(item => item.idCategoria === categoryId) ?? null;
    this.selectedCategoryId.set(category?.idCategoria ?? null);
    this.categorySearch.set(category ? `#${category.idCategoria} - ${category.nombre}` : '');
    this.categorySuggestionsVisible.set(false);
    this.data.set([]);
    this.productsError.set('');
    if (this.selectedProjectId() && category) {
      this.productsLoading.set(true);
      this.productsRequest = this.productosService.getByProjectCategory(this.selectedProjectId()!, category.idCategoria).pipe(
        timeout(45000), takeUntilDestroyed(this.destroyRef), finalize(() => this.productsLoading.set(false))
      ).subscribe({
        next: products => this.data.set(products),
        error: error => {
          console.error('Error al cargar productos por proyecto y categoría:', error);
          this.productsError.set('No se pudieron cargar los productos. La consulta falló o tardó demasiado.');
        }
      });
    }
    this.columnFilters.set([]);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
    if (sync) this.syncContext();
  }

  onProjectSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.selectedProjectId()) this.selectProject(null);
    this.projectSearch.set(value);
    this.projectSuggestionsVisible.set(true);
  }

  onCategorySearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.selectedCategoryId()) this.selectCategory(null);
    this.categorySearch.set(value);
    this.categorySuggestionsVisible.set(true);
  }

  selectProjectOption(item: IProyectoAndCategoriaArray): void {
    this.selectProject(item.proyecto.idProyecto);
  }

  selectCategoryOption(category: ICategorias): void {
    this.selectCategory(category.idCategoria);
  }

  clearProjectFilter(): void {
    this.selectProject(null);
    this.projectSuggestionsVisible.set(false);
  }

  activeFilterCount(): number {
    return this.columnFilters().length;
  }

  hasSelection(): boolean {
    return this.selectedProjectId() !== null || !!this.projectSearch().trim() || !!this.categorySearch().trim();
  }

  clearAllFilters(): void {
    this.columnFilters.set([]);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  clearSelection(): void {
    this.columnFilters.set([]);
    this.clearProjectFilter();
    this.categorySuggestionsVisible.set(false);
  }

  clearCategoryFilter(): void {
    this.selectCategory(null);
    this.categorySuggestionsVisible.set(false);
  }

  showProjectSuggestions(): void {
    this.projectSuggestionsVisible.set(true);
  }

  hideProjectSuggestions(): void {
    setTimeout(() => this.projectSuggestionsVisible.set(false), 150);
  }

  showCategorySuggestions(): void {
    if (this.selectedProjectId()) {
      this.categorySuggestionsVisible.set(true);
    }
  }

  hideCategorySuggestions(): void {
    setTimeout(() => this.categorySuggestionsVisible.set(false), 150);
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim();
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

  async delete(item: Row<IProducto>): Promise<void> {
    const productName = item.original.nombre || 'este producto';
    const confirmed = await this.alert.confirm(
      'Eliminar producto',
      `¿Deseas eliminar "${productName}"? Esta acción no se puede deshacer.`,
      'Eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    this.productosService.delete(item.original.idProducto.toString()).subscribe({
      next: () => {
        this.data.update(products => products.filter(product => product.idProducto !== item.original.idProducto));
        this.alert.success('Producto eliminado', 'El producto fue eliminado correctamente.');
      },
      error: () => this.alert.error('Operación fallida', 'No se pudo eliminar el producto.')
    });
  }

  update(item: Row<IProducto>) {
    this.router.navigate(["inventory/update/", item.original.idProducto], {
      queryParams: { idProyecto: this.selectedProjectId(), idCategoria: this.selectedCategoryId() }
    });
  }

  goToCreateProducts(): void {
    const idProyecto = this.selectedProjectId();
    const idCategoria = this.selectedCategoryId();
    if (!idProyecto || !idCategoria) {
      this.alert.warning('Selecciona el inventario', 'Selecciona un proyecto y una categoría antes de agregar productos.');
      return;
    }
    this.dialog.open<InventoryCreateComponent, InventoryCreateDialogData, boolean>(InventoryCreateComponent, {
      width: '1100px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '90vh',
      data: { idProyecto, idCategoria },
      ariaLabelledBy: 'inventory-create-title',
      disableClose: true,
      autoFocus: 'first-tabbable'
    }).afterClosed().subscribe(saved => {
      if (saved) this.getAll();
    });
  }

  sanitizeHtml(content: string): SafeHtml {
   return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
