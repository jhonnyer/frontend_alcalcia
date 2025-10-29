import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Injector, OnInit, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { Column, ColumnFiltersState, FlexRenderDirective, PaginationState, Row, RowSelectionState, SortingState, createAngularTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/angular-table';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';
import { defaultColumns } from './nucleo-columns-definitions';
import { INucleoUpdate } from '../../../../core/models/nucleo.model';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActasService } from '../../../../core/services/actas.service';
import { firstValueFrom } from 'rxjs';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-nucleos',
  standalone: true,
  imports: [CommonModule, CdkTableModule, FlexRenderDirective, TableFilterComponent, HasRoleDirective, MatCardModule, MatIconModule],
  templateUrl: './nucleos.component.html',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucleosComponent implements OnInit{
  constructor(
    private dialog: MatDialog, 
    private snackBar: MatSnackBar ,
    private sanitizer: DomSanitizer
  ) {}
  Math = Math;
  private nucleoService = inject(NucleoService);
  injector = inject(Injector);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  private readonly actasService = inject(ActasService);
  private readonly beneficiaryService=inject(BeneficiaryService);
  data = signal<INucleoUpdate[]>([]);

  public readonly sizePage = signal<number[]>([5, 10, 25, 50, 100]);
  public readonly rowSelectionState = signal<RowSelectionState>({});
  public copyOnClipboard = signal<number | null>(null);
  public readonly columnFilters = signal<ColumnFiltersState>([]);

  public readonly paginationState = signal<PaginationState>({
    pageIndex: 0,
    pageSize: 5
  })

  public readonly sortingState = signal<SortingState>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Gestión de actores sociales');
    this.getAll();
  }

  getAll() {
    this.nucleoService.getSimpleAll().subscribe({
      next: response => {
        this.data.set(response)
      },
      error: error => {
        console.log("Error getAll nucleos: ", error)
      }
    })
  }

  public dataTable = createAngularTable(() => ({
    data: this.data(),
    getCoreRowModel: getCoreRowModel(),
    columns: defaultColumns,

    //Paginación
    getPaginationRowModel: getPaginationRowModel(),

    // Ordenar filas
    getSortedRowModel: getSortedRowModel(),

    // Modelo de filtrado
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      pagination: this.paginationState(),
      sorting: this.sortingState(),
      rowSelection: this.rowSelectionState(), // Seleccion de filas
      columnFilters: this.columnFilters(), // Filtros de columnas
    },

    // Función paginación
    onPaginationChange: ( valueOrFunction ) => {
      typeof valueOrFunction === 'function'
      ? this.paginationState.update( valueOrFunction )
      : this.paginationState.set( valueOrFunction );
    },

    // Funcion ordnenar
    onSortingChange: ( valueSorting ) => {
      typeof valueSorting === 'function'
      ? this.sortingState.update( valueSorting )
      : this.sortingState.set( valueSorting );
    },

    // Selección de una fila recibe una función o un objeto
    onRowSelectionChange: (valueOrFunction) => {
      valueOrFunction instanceof Function
      ? this.rowSelectionState.update( valueOrFunction )
      : this.rowSelectionState.set( valueOrFunction );
    },

    // Manejador de cambios de filtros de columnas
    onColumnFiltersChange: updater => {
      updater instanceof Function
        ? this.columnFilters.update(updater)
        : this.columnFilters.set(updater);
    },
  }));


  // Cambio de numero de elementos por pagina
  onChangeValueSizePageSelect(e: Event){
    const element = (e.target as HTMLSelectElement);
    this.dataTable.setPageSize(+element.value);
  }

  //Ordenar filas de la tabla
  onSortingColumn(column: Column<INucleoUpdate>){
    column.toggleSorting(); // Por defecto
  }

  // Seleccionar una fila
  onCopyOnClipboard( row: Row<INucleoUpdate> ) {
    this.copyOnClipboard.set( row.original.idNucleo );
  }

  // Metodo de busqueda
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataTable.setColumnFilters([
      {
        id: 'name', // Inicialmente filtramos por la columna name
        value: value,
      },
    ]);
  }

  async delete(row: Row<INucleoUpdate>) {
    const idNucleo = row.original.idNucleo;
    const beneficiarios = row.original.beneficiarios ?? [];

    // 1️⃣ Confirmación
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '350px',
      data: { mensaje: `¿Estás seguro de eliminar el actor "${row.original.nombreNucleo}" y todos sus beneficiarios?` }
    });

    const confirmado = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmado) return;

    // 2️⃣ Verificar beneficiarios con actas
    const results: number[] = await Promise.all(
      beneficiarios.map(b =>
        firstValueFrom(this.actasService.getCountActas(b.idBeneficiario.toString()))
          .then(res => res ?? 0) // aseguramos number
      )
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i] > 0) {
        this.snackBar.open(
          `❌ El actor no puede eliminarse porque el beneficiario "${beneficiarios[i].primerNombre} ${beneficiarios[i].primerApellido}" tiene actas asociadas.`,
          'Cerrar',
          { duration: 5000 }
        );
        return; // 🚫 detenemos la eliminación
      }
    }

    // 3️⃣ Eliminar beneficiarios primero
    for (const b of beneficiarios) {
      try {
        await firstValueFrom(this.beneficiaryService.delete(b.idBeneficiario.toString()));
      } catch (err) {
        console.error(`Error eliminando beneficiario ${b.idBeneficiario}:`, err);
        this.snackBar.open(`❌ Error al eliminar beneficiario "${b.primerNombre} ${b.primerApellido}"`, 'Cerrar', { duration: 3000 });
        return; // 🚫 detenemos todo si un beneficiario no se elimina
      }
    }

    // eliminamos el núcleo
    this.nucleoService.deleteById(idNucleo.toString()).subscribe({
      next: () => {
        this.snackBar.open('✅ Actor social y beneficiarios eliminados correctamente.', 'Cerrar', { duration: 3000 });
        this.getAll(); // 🔄 refrescar tabla
      },
      error: (err) => {
        console.error('Error eliminando núcleo:', err);
        this.snackBar.open('❌ Error al eliminar el actor.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  update(item: Row<INucleoUpdate>){
    this.router.navigate(["nucleo/update/", item.original.idNucleo]);
  }

  verDetalle(item: Row<INucleoUpdate>) {
    this.router.navigate(["nucleo/detalle/", item.original.idNucleo]);
  }

  verDashboard(item: Row<INucleoUpdate>) {
    this.router.navigate(
      ["nucleo/dashboard", item.original.idNucleo],
      { queryParams: { nombre: item.original } }
    );
  }

  sanitizeHtml(content: string): SafeHtml {
   return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
