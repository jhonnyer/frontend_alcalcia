import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
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
import { defaultColumns } from './projects-columns-definitions';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule, 
    CdkTableModule, 
    FlexRenderDirective, 
    TableFilterComponent, 
    HasRoleDirective,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './projects-list.component.html',
  styles: ``
})
export class ProjectsListComponent {
  constructor(
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {}
  private proyectosService = inject(ProyectosService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private alert = inject(AlertService);
  Math = Math;

  // Cambiamos el tipo del signal para manejar el objeto completo
  data = signal<IProyectoAndCategoriaArray[]>([]);
  projectSearch = signal('');
  projectSuggestionsVisible = signal(false);
  selectedProjectId = signal<number | 'ALL'>('ALL');
  filteredProjectOptions = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    return this.data().filter(item => {
      const text = this.normalizeSearchText(`${item.proyecto.idProyecto} ${item.proyecto.nombre} ${item.proyecto.descripcion}`);
      return !query || text.includes(query);
    });
  });
  filteredData = computed(() => {
    const selectedProjectId = this.selectedProjectId();
    const query = this.normalizeSearchText(this.projectSearch());
    return this.data().filter(item => {
      const matchesSelected = selectedProjectId === 'ALL' || item.proyecto.idProyecto === selectedProjectId;
      const text = this.normalizeSearchText(`${item.proyecto.idProyecto} ${item.proyecto.nombre} ${item.proyecto.descripcion}`);
      const matchesSearch = selectedProjectId !== 'ALL' || !query || text.includes(query);
      return matchesSelected && matchesSearch;
    });
  });

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
    this.pageTitleService.setCurrentPage('Proyectos');
    this.getAll();
  }

  getAll() {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        if (response.estado === 'exito') {
          let proyectos = response.respuesta;

          // ✅ Si NO es administrador, solo mostrar proyectos activos
          if (!this.authService.hasRole('ADMIN')) {
            proyectos = proyectos.filter(p => p.proyecto.estado === 'A');
          }

          this.data.set(proyectos);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar proyectos:', error);
        this.alert.error('No se pudieron cargar los proyectos', 'Intenta nuevamente en unos momentos.');
      }
    });
  }


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

  onSortingColumn(column: Column<IProyectoAndCategoriaArray>) {
    column.toggleSorting();
  }

  onCopyOnClipboard(row: Row<IProyectoAndCategoriaArray>) {
    this.copyOnClipboard.set(row.original.proyecto.idProyecto);
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

  onProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.selectedProjectId.set('ALL');
    this.projectSuggestionsVisible.set(true);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  selectProjectOption(item: IProyectoAndCategoriaArray): void {
    this.selectedProjectId.set(item.proyecto.idProyecto);
    this.projectSearch.set(`#${item.proyecto.idProyecto} - ${item.proyecto.nombre}`);
    this.projectSuggestionsVisible.set(false);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
  }

  clearProjectFilter(): void {
    this.selectedProjectId.set('ALL');
    this.projectSearch.set('');
    this.projectSuggestionsVisible.set(false);
    this.paginationState.update(state => ({ ...state, pageIndex: 0 }));
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

  delete(item: Row<IProyectoAndCategoriaArray>): void {
    const proyecto = item.original.proyecto;

    // Obtener el proyecto completo con categorías y productos
    this.proyectosService.getById(proyecto.idProyecto.toString()).subscribe({
      next: (response) => {
        const data = response.respuesta;

        if (!data) {
          this.alert.warning('Alerta',"⚠️ No se encontró el proyecto seleccionado.");
          return;
        }

        const categorias = data.categorias || [];
        const tieneProductos = categorias.some(cat => cat.productos && cat.productos.length > 0);

        if (tieneProductos) {
          this.alert.warning('Alerta',`⚠️ No se puede inactivar el proyecto "${proyecto.nombre}" porque tiene productos asociados.`);
          return;
        }

        if (categorias.length > 0 && !tieneProductos) {
          this.alert.warning('Alerta',`⚠️ No se puede inactivar el proyecto "${proyecto.nombre}" porque tiene categorías registradas.`);
          return;
        }

        // Confirmar eliminación
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: { mensaje: `¿Deseas inactivar el proyecto "${proyecto.nombre}"?` },
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(confirmado => {
          if (confirmado) {
            this.proyectosService.delete(proyecto.idProyecto).subscribe({
              next: () => {
                this.alert.success("Operación exitosa","✅ Proyecto inactivado correctamente.");
                this.getAll(); 
              },
              error: (error) => {
                console.error('❌ Error al eliminar proyecto:', error);
                this.alert.error("Error del servicio","⚠️ No se pudo inactivar el proyecto. Intenta nuevamente.");
              }
            });
          }
        });
      },
      error: (error) => {
        console.error("❌ Error al obtener detalles del proyecto:", error);
        this.alert.error('Error del servicio',"⚠️ No se pudo verificar el estado del proyecto antes de eliminarlo.");
      }
    });
  }

  update(item: Row<IProyectoAndCategoriaArray>) {
    this.router.navigate(["projects/update/", item.original.proyecto.idProyecto]);
  }

  goToDashboard(): void {
    this.router.navigate(['/projects/dashboard']);
  }

  sanitizeHtml(content: string): SafeHtml {
   return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
