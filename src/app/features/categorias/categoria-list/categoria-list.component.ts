import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { CategoriasService } from '../../../core/services/categorias.service';
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
import { CategoriasCreateComponent } from '../categorias-create/categorias-create.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    CommonModule, 
    CdkTableModule, 
    FlexRenderDirective, 
    TableFilterComponent,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './categoria-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriaListComponent implements OnInit {
  constructor(private dialog: MatDialog) {}
  private categoriasService = inject(CategoriasService);
  private pageTitleService = inject(PageTitleService);
  private alert = inject(AlertService);

  data = signal<ICategorias[]>([]);

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
    this.pageTitleService.setCurrentPage('Lista de categorías');
    this.getAll();
  }

  getAll() {
    this.categoriasService.getAll().subscribe({
      next: response => {
        this.data.set(response);
      },
      error: error => {
        console.error("Error al cargar categorías:", error);
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

  abrirDialogEditarCategoria(categoria: ICategorias): void {
    const dialogRef = this.dialog.open(CategoriasCreateComponent, {
      width: '500px',
      data: { 
        modo: 'editar',
        categoria
      },
      disableClose: true,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.data.set([]); // Limpia temporalmente
        setTimeout(() => this.getAll(), 200); // Recarga con un leve retraso visual
      }
    });
  }

}
