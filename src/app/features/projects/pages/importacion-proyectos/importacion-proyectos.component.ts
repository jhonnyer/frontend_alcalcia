import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from '../../../../core/services/alert.service';
import { ImportacionProyectosService } from '../../../../core/services/importacion-proyectos.service';
import {
  ImportacionProyectoFila,
  ImportacionProyectosResultado,
} from '../../../../core/models/importacion-proyectos.model';

type CampoEditable =
  | 'proyecto' | 'descripcionProyecto' | 'tipoProyecto' | 'fechaInicio' | 'fechaFin' | 'contrato'
  | 'categoria' | 'producto' | 'descripcionProducto' | 'stock';

// Nombres de campo que devuelve el backend en los errores.
const CAMPO_ERROR: Record<CampoEditable, string> = {
  proyecto: 'proyecto',
  descripcionProyecto: 'descripcion_proyecto',
  tipoProyecto: 'tipo_proyecto',
  fechaInicio: 'fecha_inicio',
  fechaFin: 'fecha_fin',
  contrato: 'contrato',
  categoria: 'categoria',
  producto: 'producto',
  descripcionProducto: 'descripcion_producto',
  stock: 'stock',
};

@Component({
  selector: 'app-importacion-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
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
          <a routerLink="/projects" class="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">
            <mat-icon class="text-base">arrow_back</mat-icon>
            Proyectos
          </a>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Carga masiva de proyectos</h1>
          <p class="mt-1 max-w-3xl text-sm text-slate-600">
            Crea proyectos nuevos con sus categorías y productos. Puedes corregir o eliminar filas antes de confirmar.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-action-gray" (click)="descargarPlantilla()" [disabled]="descargandoPlantilla()">
            <mat-icon class="mr-1 text-base">{{ descargandoPlantilla() ? 'hourglass_top' : 'download' }}</mat-icon>
            {{ descargandoPlantilla() ? 'Generando plantilla...' : 'Descargar plantilla' }}
          </button>
          @if (resultado()) {
            <button type="button" class="btn-action-gray" (click)="reiniciar()">
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
            Las filas con el <strong>mismo nombre de proyecto</strong> forman un solo proyecto; el tipo, las fechas y el contrato (opcional) se diligencian en su primera fila.
            Si el nombre del proyecto ya existe, no se puede confirmar. Las categorías y productos se crean nuevos.
          </div>
        </section>

        @if (cargando()) {
          <section class="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">Procesando...</section>
        }

        @if (resultado(); as r) {
          <section class="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Filas</span><strong>{{ r.totalFilas }}</strong></div>
            <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Proyectos</span><strong>{{ r.totalProyectos }}</strong></div>
            <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Categorías</span><strong>{{ r.totalCategorias }}</strong></div>
            <div class="rounded-xl border border-slate-200 bg-white p-3"><span class="block text-xs text-slate-500">Productos</span><strong>{{ r.totalProductos }}</strong></div>
            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <span class="block text-xs text-slate-500">Errores</span>
              <strong [class]="errores().length ? 'text-red-700' : 'text-emerald-700'">{{ errores().length }}</strong>
            </div>
          </section>

          @if (errores().length) {
            <section class="rounded-xl border border-red-200 bg-white shadow-sm">
              <h2 class="border-b border-red-100 p-3 text-sm font-bold text-red-800">Errores a corregir</h2>
              <div class="max-h-60 overflow-auto">
                <table class="w-full text-left text-xs">
                  <thead class="sticky top-0 bg-red-50 text-red-900">
                    <tr><th class="p-2">Fila</th><th class="p-2">Proyecto</th><th class="p-2">Campo</th><th class="p-2">Detalle</th></tr>
                  </thead>
                  <tbody>
                    @for (e of errores(); track $index) {
                      <tr class="border-t border-slate-100">
                        <td class="p-2">{{ e.numeroFila }}</td>
                        <td class="p-2">{{ e.actorRef }}</td>
                        <td class="p-2">{{ e.campo }}</td>
                        <td class="p-2">{{ e.mensaje }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-2 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 class="text-sm font-bold text-slate-700">Filas de la carga</h2>
              <div class="flex flex-wrap gap-2">
                <input class="cell-input !w-56" placeholder="Filtrar por proyecto, categoría o producto" (input)="cambiarFiltro($event)" />
                <button type="button" class="btn-action-gray !min-h-8 !px-3 !text-xs" (click)="unificarProyecto()" title="Usa el nombre de la primera fila en todas las filas">
                  <mat-icon class="mr-1 text-base">merge_type</mat-icon>Unificar proyecto
                </button>
                <button type="button" class="btn-action-gray !min-h-8 !px-3 !text-xs" (click)="agregarFila()">
                  <mat-icon class="mr-1 text-base">add</mat-icon>Agregar fila
                </button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[1420px] text-left text-xs">
                <thead class="bg-slate-100 text-slate-700">
                  <tr>
                    <th class="p-2">#</th><th class="p-2">Proyecto</th><th class="p-2">Descripción</th><th class="p-2">Tipo</th>
                    <th class="p-2">Inicio</th><th class="p-2">Fin</th><th class="p-2">Contrato</th><th class="p-2">Categoría</th>
                    <th class="p-2">Producto</th><th class="p-2">Desc. producto</th><th class="p-2">Stock</th><th class="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of pagina(); track f) {
                    <tr class="border-t border-slate-100 align-top">
                      <td class="p-2 text-slate-500">{{ f.numeroFila ?? '*' }}</td>
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
                      <td class="p-1"><input class="cell-input" [class.cell-error]="tieneError(f, 'categoria')" [value]="f.categoria ?? ''" (input)="editar(f, 'categoria', $event)" /></td>
                      <td class="p-1"><input class="cell-input" [class.cell-error]="tieneError(f, 'producto')" [value]="f.producto ?? ''" (input)="editar(f, 'producto', $event)" /></td>
                      <td class="p-1"><input class="cell-input" [class.cell-error]="tieneError(f, 'descripcionProducto')" [value]="f.descripcionProducto ?? ''" (input)="editar(f, 'descripcionProducto', $event)" /></td>
                      <td class="p-1"><input class="cell-input !min-w-[4rem]" [class.cell-error]="tieneError(f, 'stock')" [value]="f.stock ?? ''" (input)="editar(f, 'stock', $event)" /></td>
                      <td class="p-1">
                        <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50" title="Eliminar fila" (click)="eliminar(f)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <span>Página {{ paginaActual() + 1 }} de {{ totalPaginas() }} ({{ filtradas().length }} filas)</span>
              <div class="flex items-center gap-2">
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

          <div class="flex flex-wrap items-center justify-end gap-2">
            @if (cambiosPendientes()) {
              <span class="text-xs text-amber-700">Hay cambios sin validar.</span>
              <button type="button" class="btn-action-gray" [disabled]="cargando()" (click)="validar()">
                <mat-icon class="mr-1 text-base">fact_check</mat-icon>Validar cambios
              </button>
            }
            <button type="button" class="btn-action-blue" [disabled]="!puedeConfirmar()" (click)="confirmar()">
              <mat-icon class="mr-1 text-base">check_circle</mat-icon>
              {{ errores().length ? 'Corrige los errores para confirmar' : 'Confirmar carga' }}
            </button>
          </div>
        }
      </main>
    </section>
  `,
})
export class ImportacionProyectosComponent {
  private readonly service = inject(ImportacionProyectosService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);

  readonly resultado = signal<ImportacionProyectosResultado | null>(null);
  readonly filas = signal<ImportacionProyectoFila[]>([]);
  readonly errores = signal<ImportacionProyectosResultado['errores']>([]);
  readonly archivoNombre = signal('');
  readonly cargando = signal(false);
  readonly descargandoPlantilla = signal(false);
  readonly cambiosPendientes = signal(false);
  readonly filtro = signal('');
  readonly paginaActual = signal(0);
  readonly tamanoPagina = signal(10);
  readonly opcionesPagina = [10, 25, 50, 100];

  readonly filtradas = computed(() => {
    const q = this.filtro().trim().toLocaleLowerCase();
    return this.filas().filter(f => !q ||
      [f.proyecto, f.categoria, f.producto].some(v => v?.toLocaleLowerCase().includes(q)));
  });
  readonly pagina = computed(() =>
    this.filtradas().slice(this.paginaActual() * this.tamanoPagina(), (this.paginaActual() + 1) * this.tamanoPagina()));
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamanoPagina())));

  readonly puedeConfirmar = computed(() =>
    !!this.resultado() && !this.cambiosPendientes() && this.errores().length === 0
    && this.filas().length > 0 && !this.cargando());

  // Cierre o recarga de la pestaña con cambios sin validar.
  @HostListener('window:beforeunload', ['$event'])
  avisarAlCerrar(event: BeforeUnloadEvent): void {
    if (this.cambiosPendientes()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // Navegación interna (lo usa el guard de la ruta).
  puedeSalir(): boolean | Promise<boolean> {
    if (!this.cambiosPendientes()) return true;
    return this.alert.confirm(
      'Cambios sin validar',
      'Hay cambios sin validar en la carga. Si sales, se perderán.',
      'Salir',
      'Quedarme'
    );
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.alert.error('Archivo no válido', 'Selecciona un archivo Excel .xlsx.');
      return;
    }
    this.archivoNombre.set(archivo.name);
    this.cargando.set(true);
    this.service.simular(archivo).subscribe({
      next: res => {
        this.aplicar(res.respuesta);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudo validar el archivo', this.mensajeError(error));
      },
    });
  }

  validar(): void {
    if (!this.filas().length) {
      this.alert.warning('Sin filas', 'Agrega al menos una fila para validar.');
      return;
    }
    this.cargando.set(true);
    this.service.simularFilas(this.solicitud()).subscribe({
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

  confirmar(): void {
    if (!this.puedeConfirmar()) return;
    this.cargando.set(true);
    this.service.confirmarFilas(this.solicitud()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.alert.success('Carga confirmada', 'Los proyectos, categorías y productos fueron creados.');
        this.router.navigate(['/projects']);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudo confirmar la carga', this.mensajeError(error));
      },
    });
  }

  editar(fila: ImportacionProyectoFila, campo: CampoEditable, event: Event): void {
    const valor = (event.target as HTMLInputElement | HTMLSelectElement).value;
    fila[campo] = valor === '' ? null : valor;
    this.cambiosPendientes.set(true);
  }

  eliminar(fila: ImportacionProyectoFila): void {
    this.filas.update(lista => lista.filter(f => f !== fila));
    this.paginaActual.update(p => Math.min(p, this.totalPaginas() - 1));
    this.cambiosPendientes.set(true);
  }

  agregarFila(): void {
    const nueva: ImportacionProyectoFila = {
      numeroFila: null, proyecto: null, descripcionProyecto: null, tipoProyecto: null, fechaInicio: null,
      fechaFin: null, contrato: null, categoria: null, producto: null, descripcionProducto: null, stock: null,
    };
    this.filtro.set('');
    this.filas.update(lista => [...lista, nueva]);
    this.paginaActual.set(this.totalPaginas() - 1);
    this.cambiosPendientes.set(true);
  }

  unificarProyecto(): void {
    const nombre = this.filas().find(f => f.proyecto?.trim())?.proyecto;
    if (!nombre) return;
    this.filas().forEach(f => (f.proyecto = nombre));
    this.filas.update(lista => [...lista]);
    this.cambiosPendientes.set(true);
  }

  tieneError(fila: ImportacionProyectoFila, campo: CampoEditable): boolean {
    return fila.numeroFila != null
      && this.errores().some(e => e.numeroFila === fila.numeroFila && e.campo === CAMPO_ERROR[campo]);
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
    if (this.descargandoPlantilla()) return;
    this.descargandoPlantilla.set(true);
    this.service.descargarPlantilla().subscribe({
      next: blob => {
        const enlace = document.createElement('a');
        const url = URL.createObjectURL(blob);
        enlace.href = url;
        enlace.download = 'plantilla-proyectos.xlsx';
        enlace.click();
        URL.revokeObjectURL(url);
        this.descargandoPlantilla.set(false);
      },
      error: error => {
        this.descargandoPlantilla.set(false);
        this.alert.error('No se pudo descargar la plantilla', this.mensajeError(error));
      },
    });
  }

  reiniciar(): void {
    this.resultado.set(null);
    this.filas.set([]);
    this.errores.set([]);
    this.archivoNombre.set('');
    this.cambiosPendientes.set(false);
    this.filtro.set('');
    this.paginaActual.set(0);
  }

  private aplicar(resultado: ImportacionProyectosResultado): void {
    this.resultado.set(resultado);
    this.filas.set((resultado.filas ?? []).map(f => ({ ...f, tipoProyecto: this.normalizarTipo(f.tipoProyecto) })));
    this.errores.set(resultado.errores ?? []);
    this.cambiosPendientes.set(false);
    this.paginaActual.set(0);
  }

  private normalizarTipo(tipo: string | null): string | null {
    const t = (tipo ?? '').trim().toLowerCase();
    if (t === 'm' || t === 'municipal') return 'Municipal';
    if (t === 'd' || t === 'departamental') return 'Departamental';
    return tipo;
  }

  private solicitud() {
    return { nombreArchivo: this.archivoNombre(), filas: this.filas() };
  }

  private mensajeError(error: any): string {
    return error?.error?.mensaje ?? error?.error?.message ?? 'Revisa la respuesta del servidor.';
  }
}
