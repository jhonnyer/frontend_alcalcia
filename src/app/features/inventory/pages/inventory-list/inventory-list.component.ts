import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule, 
    CdkTableModule, 
    FlexRenderDirective, 
    TableFilterComponent, 
    MatIconModule
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
    this.initialProjectId = Number(this.route.snapshot.queryParamMap.get('idProyecto')) || null;
    this.initialCategoryId = Number(this.route.snapshot.queryParamMap.get('idCategoria')) || null;
    this.getAll();
  }

  getAll() {
    this.proyectosService.getAll().subscribe({
      next: response => {
        const proyectos = response.respuesta ?? [];
        this.proyectos.set(proyectos);
        if (proyectos.length === 1) {
          this.selectProject(proyectos[0].proyecto.idProyecto);
          if (this.initialCategoryId) {
            this.selectCategory(this.initialCategoryId);
          }
        } else if (this.initialProjectId) {
          this.selectProject(this.initialProjectId);
          if (this.initialCategoryId) {
            this.selectCategory(this.initialCategoryId);
          }
        }
      },
      error: error => {
        console.error("Error al cargar productos:", error);
      }
    });
  }

  selectProject(id: number | string | null): void {
    const projectId = id === null || id === '' ? null : Number(id);
    const project = this.proyectos().find(item => item.proyecto.idProyecto === projectId) ?? null;
    this.selectedProjectId.set(projectId);
    this.selectedProject.set(project);
    this.categories.set(project?.categorias ?? []);
    this.selectedCategoryId.set(null);
    this.projectSearch.set(project ? `#${project.proyecto.idProyecto} - ${project.proyecto.nombre}` : '');
    this.categorySearch.set('');
    this.projectSuggestionsVisible.set(false);
    this.data.set([]);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  selectCategory(id: number | string | null): void {
    const categoryId = id === null || id === '' ? null : Number(id);
    const category = this.categories().find(item => item.idCategoria === categoryId) ?? null;
    this.selectedCategoryId.set(categoryId);
    this.categorySearch.set(category ? `#${category.idCategoria} - ${category.nombre}` : '');
    this.categorySuggestionsVisible.set(false);
    this.data.set([]);
    if (this.selectedProjectId() && categoryId) {
      this.productosService.getByProjectCategory(this.selectedProjectId()!, categoryId).subscribe({
        next: products => this.data.set(products),
        error: error => console.error('Error al cargar productos por proyecto y categoría:', error)
      });
    }
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  onProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.projectSuggestionsVisible.set(true);
    if (this.selectedProjectId()) {
      this.selectProject(null);
      this.projectSuggestionsVisible.set(true);
    }
  }

  onCategorySearch(event: Event): void {
    this.categorySearch.set((event.target as HTMLInputElement).value);
    this.categorySuggestionsVisible.set(true);
    if (this.selectedCategoryId()) {
      this.selectedCategoryId.set(null);
      this.data.set([]);
    }
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
    this.router.navigate(["inventory/update/", item.original.idProducto]);
  }

  goToCreateProducts(): void {
    const idProyecto = this.selectedProjectId();
    const idCategoria = this.selectedCategoryId();
    this.router.navigate(['/inventory/create'], {
      queryParams: {
        ...(idProyecto ? { idProyecto } : {}),
        ...(idCategoria ? { idCategoria } : {})
      }
    });
  }

  sanitizeHtml(content: string): SafeHtml {
   return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
