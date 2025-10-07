import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
  constructor(private dialog: MatDialog) {}
  private proyectosService = inject(ProyectosService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);
  private authService = inject(AuthService);
  Math = Math;

  // Cambiamos el tipo del signal para manejar el objeto completo
  data = signal<IProyectoAndCategoriaArray[]>([]);

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

  delete(item: Row<IProyectoAndCategoriaArray>): void {
    const proyecto = item.original.proyecto;

    // Obtener el proyecto completo con categorías y productos
    this.proyectosService.getById(proyecto.idProyecto.toString()).subscribe({
      next: (response) => {
        const data = response.respuesta;

        if (!data) {
          alert("⚠️ No se encontró el proyecto seleccionado.");
          return;
        }

        const categorias = data.categorias || [];
        const tieneProductos = categorias.some(cat => cat.productos && cat.productos.length > 0);

        if (tieneProductos) {
          alert(`⚠️ No se puede inactivar el proyecto "${proyecto.nombre}" porque tiene productos asociados.`);
          return;
        }

        if (categorias.length > 0 && !tieneProductos) {
          alert(`⚠️ No se puede inactivar el proyecto "${proyecto.nombre}" porque tiene categorías registradas.`);
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
                alert("✅ Proyecto inactivado correctamente.");
                this.getAll(); 
              },
              error: (error) => {
                console.error('❌ Error al eliminar proyecto:', error);
                alert("⚠️ No se pudo inactivar el proyecto. Intenta nuevamente.");
              }
            });
          }
        });
      },
      error: (error) => {
        console.error("❌ Error al obtener detalles del proyecto:", error);
        alert("⚠️ No se pudo verificar el estado del proyecto antes de eliminarlo.");
      }
    });
  }


  update(item: Row<IProyectoAndCategoriaArray>) {
    this.router.navigate(["projects/update/", item.original.proyecto.idProyecto]);
  }
}
