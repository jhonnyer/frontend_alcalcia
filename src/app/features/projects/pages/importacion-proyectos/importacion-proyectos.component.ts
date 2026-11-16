import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AlertService } from '../../../../core/services/alert.service';
import { ImportacionProyectosService } from '../../../../core/services/importacion-proyectos.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { mensajeErrorReporteExcel } from '../../../../shared/components/excel/excel-error.utils';
import {
  ImportacionProyectoFila,
  ImportacionProyectosResultado,
  ContextoImportacionInventario,
  ImportacionProyectosFilasRequest,
  TipoCargaProyecto,
} from '../../../../core/models/importacion-proyectos.model';

type CampoEditable =
  | 'proyecto' | 'descripcionProyecto' | 'tipoProyecto' | 'fechaInicio' | 'fechaFin' | 'contrato'
  | 'categoria' | 'descripcionCategoria' | 'producto' | 'descripcionProducto' | 'stock' | 'cantidadAgregar';

// Nombres de campo que devuelve el backend en los errores.
const CAMPO_ERROR: Record<CampoEditable, string> = {
  proyecto: 'proyecto',
  descripcionProyecto: 'descripcion_proyecto',
  tipoProyecto: 'tipo_proyecto',
  fechaInicio: 'fecha_inicio',
  fechaFin: 'fecha_fin',
  contrato: 'contrato',
  categoria: 'categoria',
  descripcionCategoria: 'descripcion_categoria',
  producto: 'producto',
  descripcionProducto: 'descripcion_producto',
  stock: 'stock',
  cantidadAgregar: 'cantidad_agregar',
};

@Component({
  selector: 'app-importacion-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .cell-input { width: 100%; min-width: 7rem; border: 1px solid #cbd5e1; border-radius: .375rem; padding: .25rem .4rem; font-size: .75rem; background: #fff; }
    .cell-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.2); }
    .cell-error { border-color: #dc2626; background: #fef2f2; }
  `],
  template: `
    <section class="min-h-full bg-slate-50 p-4 sm:p-6">
      <header class="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <a [routerLink]="rutaVolver" class="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">
            <mat-icon class="text-base">arrow_back</mat-icon>
            {{ contexto ? 'Volver al proyecto' : 'Proyectos' }}
          </a>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ titulo }}</h1>
          <p class="mt-1 max-w-3xl text-sm text-slate-600">
            {{ contexto ? (actualizar ? 'Actualiza nombres y descripciones y registra entradas de stock. Nunca resta existencias ni elimina productos.' : 'Agrega categorías y productos nuevos al proyecto. También puedes agregar productos a categorías existentes.') : 'Crea proyectos nuevos con sus categorías y productos. Puedes corregir o eliminar filas antes de confirmar.' }}
          </p>
          @if (nombreProyecto()) {
            <p class="mt-2 text-sm font-semibold text-blue-800">Proyecto: {{ nombreProyecto() }}</p>
          }
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-action-gray" (click)="descargarPlantilla()" [disabled]="descargandoPlantilla() || cargando() || cargandoProyecto() || !!errorProyecto()">
            <mat-icon class="mr-1 text-base">{{ descargandoPlantilla() ? 'hourglass_top' : 'download' }}</mat-icon>
            {{ descargandoPlantilla() ? 'Generando plantilla...' : 'Descargar plantilla' }}
          </button>
          @if (resultado()) {
            <button type="button" class="btn-action-gray" (click)="reiniciar()" [disabled]="cargando()">
              <mat-icon class="mr-1 text-base">restart_alt</mat-icon>
              Nueva carga
            </button>
          }
          <a routerLink="/projects/importacion-masiva/gestionar" class="btn-action-gray">
            <mat-icon class="mr-1 text-base">history</mat-icon>
            Gestionar cargas
          </a>
        </div>
      </header>

      <main class="mx-auto mt-5 max-w-[1600px] space-y-4">
        @if (cargandoProyecto()) {
          <p role="status" class="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">Cargando proyecto...</p>
        }
        @if (errorProyecto()) {
          <div role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <p>{{ errorProyecto() }}</p>
            <button type="button" class="btn-action-gray mt-2" (click)="cargarProyecto()">Reintentar</button>
          </div>
        }
        @if (errorBorrador()) {
          <div role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <p>{{ errorBorrador() }}</p>
            <button type="button" class="btn-action-gray mt-2" (click)="cargarBorrador()">Reintentar</button>
          </div>
        }
        @if (idBorrador()) {
          <p role="status" class="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            Borrador #{{ idBorrador() }} · {{ cambiosSinGuardar() ? 'Hay cambios sin guardar' : 'Guardado. Puedes retomarlo desde Gestionar cargas.' }}
          </p>
        }
        <fieldset class="m-0 min-w-0 space-y-4 border-0 p-0" [disabled]="cargando() || cargandoProyecto() || !!errorProyecto() || !!errorBorrador()">
        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-sm font-bold uppercase tracking-wide text-slate-700">Archivo Excel</h2>
              <p class="mt-1 text-xs text-slate-500">Excel .xlsx, máximo 5000 filas y 10 MB.</p>
            </div>
            <label class="btn-action-blue cursor-pointer">
              <mat-icon class="mr-1 text-base">upload_file</mat-icon>
              {{ archivoNombre() || 'Seleccionar archivo' }}
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="hidden" (change)="seleccionarArchivo($event)" />
            </label>
          </div>
          <div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            @if (contexto) {
              @if (actualizar) {
                Descarga la plantilla de este proyecto y conserva sus columnas ocultas.
                Repite los mismos datos de categoría en todas sus filas. Una descripción vacía borra esa descripción.
                Stock actual es solo de consulta. Cantidad a agregar inicia en 0 y solo permite sumar unidades.
                Omitir filas no elimina datos. Las salidas se realizan por actas; no se cambian códigos ni asociaciones.
              } @else {
                Una fila por producto. Repetir el nombre de la categoría agrupa sus productos.
                Si la categoría ya existe en este proyecto, deja su descripción vacía: se conserva la actual.
                Los productos deben ser nuevos; la cantidad es su stock inicial.
              }
            } @else {
            Las filas con el <strong>mismo nombre de proyecto</strong> forman un solo proyecto; el tipo, las fechas y el contrato (opcional) se diligencian en su primera fila.
            Si el nombre del proyecto ya existe, no se puede confirmar. Las categorías y productos se crean nuevos.
            }
          </div>
        </section>

        @if (cargando()) {
          <section class="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">Procesando...</section>
        }

        @if (resultado(); as r) {
          <section class="grid grid-cols-2 gap-3" [ngClass]="contexto ? 'sm:grid-cols-4' : 'sm:grid-cols-5'">
            <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Filas</span><strong>{{ r.totalFilas }}</strong></div>
            @if (!contexto) {
              <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Proyectos</span><strong>{{ r.totalProyectos }}</strong></div>
            }
            <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Categorías</span><strong>{{ r.totalCategorias }}</strong></div>
            <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Productos</span><strong>{{ r.totalProductos }}</strong></div>
            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <span class="block text-xs text-slate-500">Errores</span>
              <strong [class]="errores().length ? 'text-red-700' : 'text-emerald-700'">{{ errores().length }}</strong>
            </div>
          </section>

          <mat-tab-group class="rounded-xl bg-white" animationDuration="0ms"
            [selectedIndex]="pestana() === 'errores' ? 1 : 0" (selectedIndexChange)="cambiarPestana($event)">
            <mat-tab [label]="'Todas las filas (' + filas().length + ')'">
              <ng-template matTabContent>
                <ng-container [ngTemplateOutlet]="filasCarga" />
              </ng-template>
            </mat-tab>
            <mat-tab [label]="'Errores (' + errores().length + ')'">
              <ng-template matTabContent>
                <div class="space-y-3 p-3">
                  @if (errores().length) {
                    <p class="text-sm text-slate-600">
                      {{ filasConErrores().length }} filas con errores. Corrige sus campos aquí y pulsa
                      <strong>Validar cambios</strong> para actualizar el resultado.
                    </p>
                  } @else {
                    <p role="status" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                      No hay errores en la última validación.
                    </p>
                  }
                  @if (cambiosPendientes()) {
                    <p role="status" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                      Hay cambios sin validar. Los errores mostrados corresponden a la última validación.
                    </p>
                  }
                  @if (erroresGenerales().length) {
                    <section class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                      <h2 class="font-semibold">Otros errores de la carga</h2>
                      <p class="mt-1 text-xs">No corresponden a una fila editable. Revisa el archivo o vuelve a validar los cambios.</p>
                      <ul class="mt-2 max-h-60 list-disc space-y-1 overflow-auto pl-5">
                        @for (e of erroresGenerales(); track $index) {
                          <li>
                            @if (e.numeroFila != null) { Fila {{ e.numeroFila }}: }
                            {{ e.mensaje }}
                          </li>
                        }
                      </ul>
                    </section>
                  }
                  <ng-container [ngTemplateOutlet]="filasCarga" />
                </div>
              </ng-template>
            </mat-tab>
          </mat-tab-group>

          <ng-template #filasCarga>
          <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-2 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 class="text-sm font-bold text-slate-700">{{ pestana() === 'errores' ? 'Filas a corregir' : 'Filas de la carga' }}</h2>
              <div class="flex flex-wrap gap-2">
                <input class="cell-input !w-56" placeholder="Filtrar por proyecto, categoría o producto" [value]="filtro()" (input)="cambiarFiltro($event)" />
                @if (!contexto) {
                  <button type="button" class="btn-action-gray !min-h-8 !px-3 !text-xs" (click)="unificarProyecto()" title="Usa el nombre de la primera fila en todas las filas">
                    <mat-icon class="mr-1 text-base">merge_type</mat-icon>Unificar proyecto
                  </button>
                }
                @if (!actualizar) {
                  <button type="button" class="btn-action-gray !min-h-8 !px-3 !text-xs" (click)="agregarFila()">
                    <mat-icon class="mr-1 text-base">add</mat-icon>Agregar fila
                  </button>
                }
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs" [ngClass]="contexto ? 'min-w-[760px]' : 'min-w-[1420px]'">
                <thead class="bg-slate-100 text-slate-700">
                  <tr>
                    <th class="p-2">#</th>
                    @if (pestana() === 'errores') { <th class="p-2">Errores a corregir</th> }
                    @if (!contexto) {
                      <th class="p-2">Proyecto</th><th class="p-2">Descripción</th><th class="p-2">Tipo</th>
                      <th class="p-2">Inicio</th><th class="p-2">Fin</th><th class="p-2">Contrato</th>
                    }
                    <th class="p-2">Categoría</th>
                    @if (contexto) { <th class="p-2">Desc. categoría</th> }
                    <th class="p-2">Producto</th><th class="p-2">Desc. producto</th>
                    @if (!actualizar) { <th class="p-2">{{ contexto ? 'Cantidad inicial' : 'Stock' }}</th> }
                    @if (actualizar) { <th class="p-2">Stock actual</th><th class="p-2">Cantidad a agregar</th> }
                    <th class="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of pagina(); track f) {
                    <tr class="border-t border-slate-100 align-top">
                      <td class="p-2 text-slate-500">{{ f.numeroFila ?? '*' }}</td>
                      @if (pestana() === 'errores') {
                        <td class="min-w-[16rem] max-w-sm p-2 text-red-800">
                          <ul class="list-disc space-y-1 pl-4">
                            @for (e of erroresFila(f); track $index) {
                              <li><span class="font-semibold capitalize">{{ e.campo.split('_').join(' ') }}:</span> {{ e.mensaje }}</li>
                            }
                          </ul>
                        </td>
                      }
                      @if (!contexto) {
                      <td class="p-1"><input class="cell-input" [class.cell-error]="tieneError(f, 'proyecto')" [value]="f.proyecto ?? ''" (input)="editar(f, 'proyecto', $event)" /></td>
                      <td class="p-1"><input class="cell-input" [class.cell-error]="tieneError(f, 'descripcionProyecto')" [value]="f.descripcionProyecto ?? ''" (input)="editar(f, 'descripcionProyecto', $event)" /></td>
                      <td class="p-1">
                        <select class="cell-input" [class.cell-error]="tieneError(f, 'tipoProyecto')" (change)="editar(f, 'tipoProyecto', $event)">
                          <option value="" [selected]="!f.tipoProyecto">-</option>
                          <option value="Municipal" [selected]="f.tipoProyecto === 'Municipal'">Municipal</option>
                          <option value="Departamental" [selected]="f.tipoProyecto === 'Departamental'">Departamental</option>
                        </select>
                      </td>
                      <td class="p-1"><input type="date" class="cell-input" [class.cell-error]="tieneError(f, 'fechaInicio')" [value]="f.fechaInicio ?? ''" (input)="editar(f, 'fechaInicio', $event)" /></td>
                      <td class="p-1"><input type="date" class="cell-input" [class.cell-error]="tieneError(f, 'fechaFin')" [value]="f.fechaFin ?? ''" (input)="editar(f, 'fechaFin', $event)" /></td>
                      <td class="p-1"><input class="cell-input" maxlength="100" placeholder="Opcional" [class.cell-error]="tieneError(f, 'contrato')" [value]="f.contrato ?? ''" (input)="editar(f, 'contrato', $event)" /></td>
                      }
                      <td class="p-1"><input class="cell-input" [class.cell-error]="tieneError(f, 'categoria')" [value]="f.categoria ?? ''" (input)="editar(f, 'categoria', $event)" /></td>
                      @if (contexto) {
                        <td class="p-1"><input class="cell-input" maxlength="500" [class.cell-error]="tieneError(f, 'descripcionCategoria')" [value]="f.descripcionCategoria ?? ''" (input)="editar(f, 'descripcionCategoria', $event)" /></td>
                      }
                      <td class="p-1"><input class="cell-input" [disabled]="actualizar && !f.idProducto" [class.cell-error]="tieneError(f, 'producto')" [value]="f.producto ?? ''" (input)="editar(f, 'producto', $event)" /></td>
                      <td class="p-1"><input class="cell-input" [disabled]="actualizar && !f.idProducto" [class.cell-error]="tieneError(f, 'descripcionProducto')" [value]="f.descripcionProducto ?? ''" (input)="editar(f, 'descripcionProducto', $event)" /></td>
                      @if (!actualizar) {
                      <td class="p-1"><input class="cell-input !min-w-[4rem]" [class.cell-error]="tieneError(f, 'stock')" [value]="f.stock ?? ''" (input)="editar(f, 'stock', $event)" /></td>
                      }
                      @if (actualizar) {
                        <td class="p-1">
                          <input class="cell-input !min-w-[5rem] !bg-slate-100 text-slate-600" readonly aria-label="Stock actual, solo lectura" [value]="f.stockActual ?? '—'" />
                        </td>
                        <td class="p-1">
                          <input type="number" min="0" step="1" class="cell-input !min-w-[5rem]" [disabled]="!f.idProducto"
                            [class.cell-error]="tieneError(f, 'cantidadAgregar')" [value]="f.cantidadAgregar ?? '0'" (input)="editar(f, 'cantidadAgregar', $event)" />
                        </td>
                      }
                      <td class="p-1">
                        <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50" title="Quitar de la carga (no elimina datos guardados)" (click)="eliminar(f)">
                          <mat-icon>{{ actualizar ? 'remove_circle_outline' : 'delete' }}</mat-icon>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="p-6 text-center text-slate-500"
                        [attr.colspan]="(contexto ? (actualizar ? 8 : 7) : 12) + (pestana() === 'errores' ? 1 : 0)">
                        {{ filtro().trim() ? 'No hay filas que coincidan con el filtro.' : 'No hay filas para mostrar en esta pestaña.' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>Página {{ paginaActual() + 1 }} de {{ totalPaginas() }} ({{ filtradas().length }} filas)</span>
              <div class="flex flex-wrap items-center gap-2">
                <label class="hidden items-center gap-1 text-xs sm:flex">
                  Filas por página
                  <select class="cell-input !w-auto !min-w-0" (change)="cambiarTamano($event)">
                    @for (n of opcionesPagina; track n) {
                      <option [value]="n" [selected]="n === tamanoPagina()">{{ n }}</option>
                    }
                  </select>
                </label>
                <button type="button" class="btn-action-gray" (click)="anterior()" [disabled]="paginaActual() === 0">Anterior</button>
                <button type="button" class="btn-action-gray" (click)="siguiente()" [disabled]="paginaActual() >= totalPaginas() - 1">Siguiente</button>
              </div>
            </div>
          </section>
          </ng-template>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <button type="button" class="btn-action-gray" [disabled]="cargando() || !!r.confirmada || (!cambiosSinGuardar() && !!idBorrador())" (click)="guardarBorrador()">
              <mat-icon class="mr-1 text-base">save</mat-icon>Guardar borrador
            </button>
            @if (cambiosPendientes()) {
              <span class="text-xs text-amber-700">Hay cambios sin validar.</span>
              <button type="button" class="btn-action-gray" [disabled]="cargando()" (click)="validar()">
                <mat-icon class="mr-1 text-base">fact_check</mat-icon>Validar cambios
              </button>
            }
            <button type="button" class="btn-action-blue" [disabled]="!puedeConfirmar()" (click)="confirmar()">
              <mat-icon class="mr-1 text-base">check_circle</mat-icon>
              Validar y confirmar carga
            </button>
          </div>
        }
        </fieldset>
      </main>
    </section>
  `,
})
export class ImportacionProyectosComponent implements OnInit {
  private readonly service = inject(ImportacionProyectosService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly proyectosService = inject(ProyectosService);
  readonly contexto: ContextoImportacionInventario | undefined = this.route.snapshot.paramMap.has('id')
    ? { idProyecto: Number(this.route.snapshot.paramMap.get('id')), actualizar: this.route.snapshot.data['actualizarInventario'] === true }
    : undefined;
  readonly actualizar = this.contexto?.actualizar ?? false;
  readonly tipoOperacion: TipoCargaProyecto = this.contexto
    ? (this.actualizar ? 'ACTUALIZAR_INVENTARIO' : 'CREAR_INVENTARIO') : 'PROYECTOS';
  readonly rutaVolver = this.contexto ? ['/projects/update', this.contexto.idProyecto] : ['/projects'];
  readonly titulo = this.contexto
    ? (this.actualizar ? 'Actualizar datos y agregar stock' : 'Cargar categorías y productos')
    : 'Carga masiva de proyectos';
  readonly nombreProyecto = signal('');
  readonly cargandoProyecto = signal(!!this.contexto);
  readonly errorProyecto = signal('');
  readonly errorBorrador = signal('');
  readonly idBorrador = signal<number | null>(null);
  readonly versionBorrador = signal<number | null>(null);
  readonly cambiosSinGuardar = signal(false);

  readonly resultado = signal<ImportacionProyectosResultado | null>(null);
  readonly filas = signal<ImportacionProyectoFila[]>([]);
  readonly errores = signal<ImportacionProyectosResultado['errores']>([]);
  readonly archivoNombre = signal('');
  readonly cargando = signal(false);
  readonly descargandoPlantilla = signal(false);
  readonly cambiosPendientes = signal(false);
  readonly filtro = signal('');
  readonly pestana = signal<'filas' | 'errores'>('filas');
  readonly paginaActual = signal(0);
  readonly tamanoPagina = signal(10);
  readonly opcionesPagina = [5, 10, 25, 50, 100];

  readonly erroresPorFila = computed(() => {
    const indice = new Map<number, ImportacionProyectosResultado['errores']>();
    for (const error of this.errores()) {
      if (error.numeroFila == null) continue;
      const lista = indice.get(error.numeroFila) ?? [];
      lista.push(error);
      indice.set(error.numeroFila, lista);
    }
    return indice;
  });
  readonly filasConErrores = computed(() =>
    this.filas().filter(f => f.numeroFila != null && this.erroresPorFila().has(f.numeroFila)));
  readonly erroresGenerales = computed(() => {
    const numeros = new Set(this.filas().map(f => f.numeroFila).filter(n => n != null));
    return this.errores().filter(e => e.numeroFila == null || !numeros.has(e.numeroFila));
  });
  readonly filtradas = computed(() => {
    const q = this.filtro().trim().toLocaleLowerCase();
    const filas = this.pestana() === 'errores' ? this.filasConErrores() : this.filas();
    return filas.filter(f => !q ||
      [f.proyecto, f.categoria, f.producto].some(v => v?.toLocaleLowerCase().includes(q)));
  });
  readonly pagina = computed(() =>
    this.filtradas().slice(this.paginaActual() * this.tamanoPagina(), (this.paginaActual() + 1) * this.tamanoPagina()));
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamanoPagina())));

  readonly puedeConfirmar = computed(() =>
    !!this.resultado() && !this.resultado()?.confirmada
    && this.filas().length > 0 && !this.cargando() && !this.cargandoProyecto() && !this.errorProyecto() && !this.errorBorrador());

  ngOnInit(): void {
    if (this.contexto) this.cargarProyecto();
    if (this.route.snapshot.queryParamMap.has('borrador')) this.cargarBorrador();
  }

  async cargarBorrador(): Promise<void> {
    const id = Number(this.route.snapshot.queryParamMap.get('borrador'));
    this.errorBorrador.set('');
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorBorrador.set('El identificador del borrador no es válido.');
      return;
    }
    this.cargando.set(true);
    try {
      const { respuesta } = await firstValueFrom(this.service.obtenerBorrador(id));
      if (respuesta.tipoOperacion !== this.tipoOperacion || respuesta.idProyecto !== (this.contexto?.idProyecto ?? null)) {
        this.errorBorrador.set('El borrador pertenece a otra operación o proyecto. Ábrelo desde Gestionar cargas.');
        return;
      }
      this.idBorrador.set(respuesta.idImportacion);
      this.versionBorrador.set(respuesta.versionDatos);
      this.archivoNombre.set(respuesta.nombreArchivo);
      this.aplicar(respuesta.resultado);
      this.cambiosSinGuardar.set(false);
    } catch (error) {
      this.errorBorrador.set(this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  cargarProyecto(): void {
    if (!this.contexto) return;
    this.errorProyecto.set('');
    if (!Number.isSafeInteger(this.contexto.idProyecto) || this.contexto.idProyecto <= 0) {
      this.cargandoProyecto.set(false);
      this.errorProyecto.set('El identificador del proyecto no es válido.');
      return;
    }
    this.cargandoProyecto.set(true);
    this.proyectosService.getById(String(this.contexto.idProyecto)).subscribe({
      next: ({ respuesta }) => {
        this.nombreProyecto.set(respuesta.proyecto.nombre);
        this.cargandoProyecto.set(false);
      },
      error: error => {
        this.cargandoProyecto.set(false);
        this.errorProyecto.set(this.mensajeError(error));
      }
    });
  }

  // Cierre o recarga de la pestaña con cambios sin guardar.
  @HostListener('window:beforeunload', ['$event'])
  avisarAlCerrar(event: BeforeUnloadEvent): void {
    if (this.cargando() || this.cambiosSinGuardar()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // Navegación interna (lo usa el guard de la ruta).
  puedeSalir(): boolean | Promise<boolean> {
    if (this.cargando()) return false;
    if (!this.cambiosSinGuardar()) return true;
    return this.alert.confirm(
      'Carga pendiente',
      'Hay cambios sin guardar en el borrador. Si sales, se perderán esos cambios.',
      'Salir',
      'Quedarme'
    );
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || this.cargando() || this.cargandoProyecto() || this.errorProyecto()) return;
    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.alert.error('Archivo no válido', 'Selecciona un archivo Excel .xlsx.');
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      this.alert.error('Archivo demasiado grande', 'El tamaño máximo es de 10 MB.');
      return;
    }
    this.cargando.set(true);
    this.service.simular(archivo, this.contexto).subscribe({
      next: res => {
        this.archivoNombre.set(archivo.name);
        this.aplicar(res.respuesta);
        this.cambiosSinGuardar.set(true);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudo validar el archivo', this.mensajeError(error));
      },
    });
  }

  validar(): void {
    if (this.cargando()) return;
    if (!this.filas().length) {
      this.alert.warning('Sin filas', 'Agrega al menos una fila para validar.');
      return;
    }
    this.cargando.set(true);
    this.service.simularFilas(this.solicitud(), this.contexto).subscribe({
      next: res => {
        this.aplicar(res.respuesta);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudieron validar los cambios', this.mensajeError(error));
      },
    });
  }

  async guardarBorrador(): Promise<void> {
    if (this.cargando()) return;
    this.cargando.set(true);
    try {
      await this.persistirBorrador();
      this.alert.success('Borrador guardado', 'Puedes retomarlo desde Gestionar cargas. No se han aplicado cambios al inventario.');
    } catch (error) {
      this.alert.error('No se pudo guardar el borrador', this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  private async persistirBorrador(): Promise<{ id: number; version: number }> {
    const { respuesta } = await firstValueFrom(this.service.guardarBorrador({
      ...this.solicitud(), versionDatos: this.versionBorrador(), tipoOperacion: this.tipoOperacion,
      ...(this.contexto ? { idProyecto: this.contexto.idProyecto } : {})
    }, this.idBorrador()));
    this.idBorrador.set(respuesta.idImportacion);
    this.versionBorrador.set(respuesta.versionDatos);
    this.resultado.set({ ...respuesta.resultado, errores: this.errores() });
    this.filas.set(respuesta.resultado.filas.map(f => ({ ...f, tipoProyecto: this.normalizarTipo(f.tipoProyecto) })));
    this.cambiosSinGuardar.set(false);
    void this.router.navigate([], {
      relativeTo: this.route, queryParams: { borrador: respuesta.idImportacion },
      queryParamsHandling: 'merge', replaceUrl: true
    });
    return { id: respuesta.idImportacion, version: respuesta.versionDatos };
  }

  async confirmar(): Promise<void> {
    if (!this.puedeConfirmar()) return;
    this.cargando.set(true);
    try {
      const validacion = await firstValueFrom(this.service.simularFilas(this.solicitud(), this.contexto));
      this.aplicar(validacion.respuesta);
      if (this.errores().length) {
        this.alert.warning('Carga con errores', `Corrige los ${this.errores().length} errores indicados antes de confirmar. Puedes guardar el borrador mientras los corriges.`);
        return;
      }
      const r = validacion.respuesta;
      const productos = new Map<number, number>();
      if (this.actualizar) {
        this.filas().forEach(f => {
          if (f.idProducto) productos.set(f.idProducto, Number(f.cantidadAgregar ?? 0));
        });
      }
      const unidades = [...productos.values()].reduce((total, cantidad) => total + cantidad, 0);
      const detalle = this.actualizar
        ? `Se actualizarán los datos de ${r.totalCategorias} categorías y ${r.totalProductos} productos. Se agregarán ${unidades} unidades de stock en total. No se resta stock ni se eliminan registros.`
        : `${this.contexto ? '' : r.totalProyectos + ' proyectos, '}${r.totalCategorias} categorías y ${r.totalProductos} productos en la carga. No se modificará nada hasta confirmar.`;
      if (!await this.alert.confirm('Confirmar carga validada', detalle + ' Una vez confirmada no podrás editar esta carga.', 'Confirmar carga', 'Seguir revisando')) return;
      const borrador = await this.persistirBorrador();
      const res = await firstValueFrom(this.service.confirmarBorrador(borrador.id, borrador.version));
      this.resultado.set(res.respuesta);
      this.cambiosPendientes.set(false);
      this.cambiosSinGuardar.set(false);
      this.alert.success('Carga confirmada', this.actualizar
        ? `Datos actualizados y ${unidades} unidades agregadas al stock.`
        : 'La carga se aplicó correctamente.');
      this.cargando.set(false);
      void this.router.navigate(this.rutaVolver);
    } catch (error) {
      this.cambiosPendientes.set(true);
      this.alert.error('No se pudo confirmar la carga', this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  editar(fila: ImportacionProyectoFila, campo: CampoEditable, event: Event): void {
    const valor = (event.target as HTMLInputElement | HTMLSelectElement).value;
    fila[campo] = valor === '' ? null : valor;
    if (this.actualizar && (campo === 'categoria' || campo === 'descripcionCategoria')) {
      this.filas().filter(f => f.idCategoria === fila.idCategoria).forEach(f => f[campo] = valor === '' ? null : valor);
      this.filas.update(filas => [...filas]);
    }
    if (this.actualizar && fila.idProducto && (campo === 'producto' || campo === 'descripcionProducto' || campo === 'cantidadAgregar')) {
      this.filas().filter(f => f.idProducto === fila.idProducto).forEach(f => f[campo] = valor === '' ? null : valor);
      this.filas.update(filas => [...filas]);
    }
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  eliminar(fila: ImportacionProyectoFila): void {
    this.filas.update(lista => lista.filter(f => f !== fila));
    this.paginaActual.update(p => Math.min(p, this.totalPaginas() - 1));
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  agregarFila(): void {
    const nueva: ImportacionProyectoFila = {
      numeroFila: null, proyecto: this.contexto ? this.nombreProyecto() : null, descripcionProyecto: null, tipoProyecto: null, fechaInicio: null,
      fechaFin: null, contrato: null, categoria: null, producto: null, descripcionProducto: null, stock: null,
    };
    this.cambiarPestana(0);
    this.filtro.set('');
    this.filas.update(lista => [...lista, nueva]);
    this.paginaActual.set(this.totalPaginas() - 1);
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  unificarProyecto(): void {
    const nombre = this.filas().find(f => f.proyecto?.trim())?.proyecto;
    if (!nombre) return;
    this.filas().forEach(f => (f.proyecto = nombre));
    this.filas.update(lista => [...lista]);
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  tieneError(fila: ImportacionProyectoFila, campo: CampoEditable): boolean {
    return this.erroresFila(fila).some(e => e.campo === CAMPO_ERROR[campo]);
  }

  erroresFila(fila: ImportacionProyectoFila): ImportacionProyectosResultado['errores'] {
    return fila.numeroFila == null ? [] : this.erroresPorFila().get(fila.numeroFila) ?? [];
  }

  cambiarPestana(indice: number): void {
    const pestana = indice === 1 ? 'errores' : 'filas';
    if (this.pestana() === pestana) return;
    this.pestana.set(pestana);
    this.filtro.set('');
    this.paginaActual.set(0);
  }

  cambiarFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.paginaActual.set(0);
  }

  anterior(): void { this.paginaActual.update(v => Math.max(0, v - 1)); }
  siguiente(): void { this.paginaActual.update(v => Math.min(this.totalPaginas() - 1, v + 1)); }

  cambiarTamano(event: Event): void {
    this.tamanoPagina.set(Number((event.target as HTMLSelectElement).value));
    this.paginaActual.set(0);
  }

  descargarPlantilla(): void {
    if (this.descargandoPlantilla() || this.cargando() || this.cargandoProyecto() || this.errorProyecto()) return;
    this.descargandoPlantilla.set(true);
    this.service.descargarPlantilla(this.contexto).subscribe({
      next: blob => {
        const enlace = document.createElement('a');
        const url = URL.createObjectURL(blob);
        enlace.href = url;
        enlace.download = this.contexto
          ? `proyecto-${this.contexto.idProyecto}-${this.actualizar ? 'actualizar-datos' : 'nuevos-productos'}.xlsx`
          : 'plantilla-proyectos.xlsx';
        enlace.click();
        URL.revokeObjectURL(url);
        this.descargandoPlantilla.set(false);
      },
      error: async error => {
        this.descargandoPlantilla.set(false);
        this.alert.error('No se pudo descargar la plantilla', await mensajeErrorReporteExcel(error));
      },
    });
  }

  async reiniciar(): Promise<void> {
    if (!await this.puedeSalir()) return;
    this.resultado.set(null);
    this.filas.set([]);
    this.errores.set([]);
    this.archivoNombre.set('');
    this.cambiosPendientes.set(false);
    this.filtro.set('');
    this.pestana.set('filas');
    this.paginaActual.set(0);
    this.idBorrador.set(null);
    this.versionBorrador.set(null);
    this.cambiosSinGuardar.set(false);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { borrador: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private aplicar(resultado: ImportacionProyectosResultado): void {
    this.resultado.set(resultado);
    this.filas.set((resultado.filas ?? []).map(f => ({ ...f, tipoProyecto: this.normalizarTipo(f.tipoProyecto) })));
    this.errores.set(resultado.errores ?? []);
    if (this.errores().length) this.cambiarPestana(1);
    this.cambiosPendientes.set(false);
    this.paginaActual.set(0);
  }

  private normalizarTipo(tipo: string | null): string | null {
    const t = (tipo ?? '').trim().toLowerCase();
    if (t === 'm' || t === 'municipal') return 'Municipal';
    if (t === 'd' || t === 'departamental') return 'Departamental';
    return tipo;
  }

  private solicitud(): ImportacionProyectosFilasRequest {
    return { nombreArchivo: this.archivoNombre(), filas: this.filas() };
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (typeof body === 'string' && body.trim()) return body;
      if (body && typeof body === 'object') {
        if ('mensaje' in body && typeof body.mensaje === 'string') return body.mensaje;
        if ('message' in body && typeof body.message === 'string') return body.message;
      }
    }
    return 'No se pudo completar la operación. Revisa la conexión y la respuesta del servidor.';
  }
}
