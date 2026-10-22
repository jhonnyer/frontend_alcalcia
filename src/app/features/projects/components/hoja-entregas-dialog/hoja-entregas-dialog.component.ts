import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { FiltroHojaEntregas, IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ProyectosService } from '../../../../core/services/proyectos.service';

export interface HojaEntregasDialogData {
  proyectos: IProyectoAndCategoriaArray[];
  idProyectoInicial?: number;
}

type TipoPeriodo = 'todo' | 'anio' | 'mes' | 'rango';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Component({
  selector: 'app-hoja-entregas-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule],
  template: `
    <div class="flex max-h-[92vh] w-full flex-col text-sm text-slate-700">
      <header class="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><mat-icon>table_view</mat-icon></span>
          <div>
            <h2 class="!m-0 !text-lg !font-semibold !leading-tight text-slate-800">Hoja de trabajo de entregas</h2>
            <p class="!m-0 text-xs text-slate-500">Una hoja por proyecto y categoría. Todos los filtros son opcionales.</p>
          </div>
        </div>
        <button type="button" class="rounded-md p-1 text-slate-500 hover:bg-slate-100" (click)="cerrar()" aria-label="Cerrar"><mat-icon>close</mat-icon></button>
      </header>

      <div class="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
        <!-- Periodo -->
        <section class="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4" aria-labelledby="hoja-periodo">
          <div id="hoja-periodo" class="mb-2 flex items-center gap-2 font-semibold text-slate-800">
            <mat-icon class="!h-5 !w-5 !text-xl text-slate-500">event</mat-icon> Periodo
          </div>
          <div class="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:grid-cols-4" role="radiogroup" aria-label="Tipo de periodo">
            @for (opcion of opcionesPeriodo; track opcion.valor) {
              <button type="button" role="radio" [attr.aria-checked]="tipoPeriodo() === opcion.valor"
                class="rounded-md px-3 py-1.5 text-xs font-medium transition"
                [class]="tipoPeriodo() === opcion.valor ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
                (click)="tipoPeriodo.set(opcion.valor)">{{ opcion.etiqueta }}</button>
            }
          </div>
          @if (tipoPeriodo() === 'anio' || tipoPeriodo() === 'mes') {
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="flex flex-col gap-1 text-xs font-medium text-slate-600">Año
                <select class="input-base" [value]="anio()" (change)="anio.set(+$any($event.target).value)">
                  @for (a of anios; track a) { <option [value]="a">{{ a }}</option> }
                </select>
              </label>
              @if (tipoPeriodo() === 'mes') {
                <label class="flex flex-col gap-1 text-xs font-medium text-slate-600">Mes
                  <select class="input-base" [value]="mes()" (change)="mes.set(+$any($event.target).value)">
                    @for (m of meses; track $index) { <option [value]="$index + 1">{{ m }}</option> }
                  </select>
                </label>
              }
            </div>
          }
          @if (tipoPeriodo() === 'rango') {
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="flex flex-col gap-1 text-xs font-medium text-slate-600">Desde
                <input type="date" class="input-base" [value]="fechaInicio()" (change)="fechaInicio.set($any($event.target).value)" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-medium text-slate-600">Hasta
                <input type="date" class="input-base" [value]="fechaFin()" (change)="fechaFin.set($any($event.target).value)" />
              </label>
            </div>
            <p class="!mb-0 !mt-2 text-xs text-slate-500">Puedes dejar una de las dos fechas vacía para un rango abierto.</p>
          }
        </section>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Proyectos -->
          <section class="flex min-w-0 flex-col rounded-xl border border-slate-200" aria-labelledby="hoja-proyectos">
            <div class="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
              <span id="hoja-proyectos" class="flex items-center gap-2 font-semibold text-slate-800">
                Proyectos
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{{ proyectosSeleccionados().size || 'Todos con entregas' }}</span>
              </span>
              @if (proyectosSeleccionados().size) {
                <button type="button" class="text-xs font-medium text-blue-600 hover:underline" (click)="limpiarProyectos()">Quitar selección</button>
              }
            </div>
            <div class="p-2">
              <div class="relative">
                <mat-icon class="pointer-events-none absolute left-2 top-1/2 !h-5 !w-5 -translate-y-1/2 !text-xl text-slate-400">search</mat-icon>
                <input type="text" class="input-base !pl-9" placeholder="Buscar proyecto o contrato" aria-label="Buscar proyecto o contrato"
                  [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" />
              </div>
            </div>
            <div class="h-52 overflow-y-auto px-1 pb-2 md:h-64">
              @for (item of proyectosFiltrados(); track item.proyecto.idProyecto) {
                <label class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                  [class.bg-blue-50]="proyectosSeleccionados().has(item.proyecto.idProyecto)">
                  <input type="checkbox" class="mt-0.5 shrink-0 accent-blue-600" [checked]="proyectosSeleccionados().has(item.proyecto.idProyecto)" (change)="alternarProyecto(item.proyecto.idProyecto)" />
                  <span class="min-w-0">
                    <span class="block break-words font-medium leading-snug">#{{ item.proyecto.idProyecto }} · {{ item.proyecto.nombre }}</span>
                    @if (item.proyecto.contrato) { <span class="block text-xs text-slate-500">Contrato {{ item.proyecto.contrato }}</span> }
                  </span>
                </label>
              } @empty {
                <p class="!m-0 px-3 py-2 text-xs text-slate-500">No hay proyectos que coincidan.</p>
              }
            </div>
          </section>

          <!-- Categorías -->
          <section class="flex min-w-0 flex-col rounded-xl border border-slate-200" aria-labelledby="hoja-categorias">
            <div class="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
              <span id="hoja-categorias" class="flex items-center gap-2 font-semibold text-slate-800">
                Categorías
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{{ categoriasSeleccionadas().size || 'Todas' }}</span>
              </span>
              @if (categoriasSeleccionadas().size) {
                <button type="button" class="text-xs font-medium text-blue-600 hover:underline" (click)="limpiarCategorias()">Quitar selección</button>
              }
            </div>
            <div class="flex h-52 flex-wrap content-start gap-2 overflow-y-auto p-3 md:h-[19.5rem]">
              @for (cat of categoriasDisponibles(); track cat.idCategoria) {
                <button type="button" class="max-w-full break-words rounded-full border px-3 py-1 text-left text-xs font-medium transition"
                  [attr.aria-pressed]="categoriasSeleccionadas().has(cat.idCategoria)"
                  [class]="categoriasSeleccionadas().has(cat.idCategoria) ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'"
                  (click)="alternarCategoria(cat.idCategoria)">{{ cat.nombre }}</button>
              } @empty {
                <p class="!m-0 text-xs text-slate-500">Los proyectos seleccionados no tienen categorías.</p>
              }
            </div>
          </section>
        </div>

        @if (error()) {
          <div role="alert" class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <mat-icon class="!h-4 !w-4 shrink-0 !text-base">error_outline</mat-icon>{{ error() }}
          </div>
        }
      </div>

      <footer class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p class="!m-0 flex items-start gap-1.5 text-xs text-slate-500">
          <mat-icon class="!h-4 !w-4 shrink-0 !text-base">info</mat-icon>{{ resumen() }}
        </p>
        <div class="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button type="button" class="btn-action-gray" (click)="cerrar()" [disabled]="descargando()">Cancelar</button>
          <button type="button" class="btn-action-blue inline-flex items-center justify-center gap-1 whitespace-nowrap" (click)="descargar()" [disabled]="descargando()">
            <mat-icon class="text-base">{{ descargando() ? 'hourglass_top' : 'download' }}</mat-icon>
            {{ descargando() ? 'Generando…' : 'Descargar Excel' }}
          </button>
        </div>
      </footer>
    </div>
  `
})
export class HojaEntregasDialogComponent {
  private dialogRef = inject(MatDialogRef<HojaEntregasDialogComponent>);
  private data = inject<HojaEntregasDialogData>(MAT_DIALOG_DATA);
  private proyectosService = inject(ProyectosService);
  private destroyRef = inject(DestroyRef);

  readonly meses = MESES;
  readonly anios = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + 1 - i);
  readonly opcionesPeriodo: { valor: TipoPeriodo; etiqueta: string }[] = [
    { valor: 'todo', etiqueta: 'Todo' },
    { valor: 'anio', etiqueta: 'Por año' },
    { valor: 'mes', etiqueta: 'Por mes' },
    { valor: 'rango', etiqueta: 'Rango de fechas' }
  ];

  tipoPeriodo = signal<TipoPeriodo>('todo');
  anio = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth() + 1);
  fechaInicio = signal('');
  fechaFin = signal('');
  busqueda = signal('');
  proyectosSeleccionados = signal(new Set<number>(this.data.idProyectoInicial ? [this.data.idProyectoInicial] : []));
  categoriasSeleccionadas = signal(new Set<number>());
  descargando = signal(false);
  error = signal('');

  proyectosFiltrados = computed(() => {
    const q = this.normalizar(this.busqueda());
    return this.data.proyectos.filter(item => !q || this.normalizar(
      `${item.proyecto.idProyecto} ${item.proyecto.nombre} ${item.proyecto.contrato ?? ''}`).includes(q));
  });

  categoriasDisponibles = computed(() => {
    const seleccion = this.proyectosSeleccionados();
    const fuente = seleccion.size ? this.data.proyectos.filter(p => seleccion.has(p.proyecto.idProyecto)) : this.data.proyectos;
    const unicas = new Map<number, { idCategoria: number; nombre: string }>();
    fuente.forEach(p => p.categorias.forEach(c => unicas.set(c.idCategoria, { idCategoria: c.idCategoria, nombre: c.nombre })));
    return [...unicas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  resumen = computed(() => {
    const p = this.proyectosSeleccionados().size;
    const c = this.categoriasSeleccionadas().size;
    const proyectos = p ? `${p} proyecto${p === 1 ? '' : 's'}` : 'Proyectos con entregas';
    const categorias = c ? `${c} categoría${c === 1 ? '' : 's'}` : 'todas las categorías';
    return `${proyectos} · ${categorias} · ${this.descripcionPeriodo()}`;
  });

  alternarProyecto(id: number): void {
    this.proyectosSeleccionados.update(actual => this.alternar(actual, id));
    const disponibles = new Set(this.categoriasDisponibles().map(c => c.idCategoria));
    this.categoriasSeleccionadas.update(actual => new Set([...actual].filter(c => disponibles.has(c))));
  }

  limpiarProyectos(): void {
    this.proyectosSeleccionados.set(new Set());
  }

  alternarCategoria(id: number): void {
    this.categoriasSeleccionadas.update(actual => this.alternar(actual, id));
  }

  limpiarCategorias(): void {
    this.categoriasSeleccionadas.set(new Set());
  }

  descargar(): void {
    const filtro = this.construirFiltro();
    if (!filtro) return;
    this.error.set('');
    this.descargando.set(true);
    this.proyectosService.descargarHojaEntregas(filtro).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.descargando.set(false))
    ).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = this.nombreArchivo();
        enlace.click();
        window.URL.revokeObjectURL(url);
        this.dialogRef.close(true);
      },
      error: async err => {
        let mensaje = 'No se pudo generar la hoja de trabajo de entregas.';
        if (err?.error instanceof Blob) {
          try {
            mensaje = JSON.parse(await err.error.text())?.mensaje || mensaje;
          } catch { /* respuesta sin JSON */ }
        }
        this.error.set(mensaje);
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }

  private construirFiltro(): FiltroHojaEntregas | null {
    const filtro: FiltroHojaEntregas = {
      idProyectos: [...this.proyectosSeleccionados()],
      idCategorias: [...this.categoriasSeleccionadas()]
    };
    switch (this.tipoPeriodo()) {
      case 'anio':
        filtro.anio = this.anio();
        break;
      case 'mes':
        filtro.anio = this.anio();
        filtro.mes = this.mes();
        break;
      case 'rango':
        if (!this.fechaInicio() && !this.fechaFin()) {
          this.error.set('Indica al menos una fecha del rango.');
          return null;
        }
        if (this.fechaInicio() && this.fechaFin() && this.fechaInicio() > this.fechaFin()) {
          this.error.set('La fecha inicial no puede ser posterior a la fecha final.');
          return null;
        }
        filtro.fechaInicio = this.fechaInicio() || undefined;
        filtro.fechaFin = this.fechaFin() || undefined;
        break;
    }
    return filtro;
  }

  private nombreArchivo(): string {
    const partes = ['Hoja de trabajo entregas'];
    const seleccion = this.proyectosSeleccionados();
    if (seleccion.size === 1) {
      const proyecto = this.data.proyectos.find(p => seleccion.has(p.proyecto.idProyecto))?.proyecto;
      if (proyecto) partes.push(proyecto.contrato || proyecto.nombre);
    }
    switch (this.tipoPeriodo()) {
      case 'anio': partes.push(String(this.anio())); break;
      case 'mes': partes.push(`${MESES[this.mes() - 1]} ${this.anio()}`); break;
      case 'rango': partes.push([this.fechaInicio() || 'inicio', this.fechaFin() || 'hoy'].join(' a ')); break;
    }
    const nombre = partes.join(' - ').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    return `${nombre}.xlsx`;
  }

  private descripcionPeriodo(): string {
    switch (this.tipoPeriodo()) {
      case 'anio': return `año ${this.anio()}`;
      case 'mes': return `${MESES[this.mes() - 1]} ${this.anio()}`;
      case 'rango': return `${this.fechaInicio() || 'inicio'} a ${this.fechaFin() || 'hoy'}`;
      default: return 'todo el periodo';
    }
  }

  private alternar(actual: Set<number>, id: number): Set<number> {
    const nuevo = new Set(actual);
    nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
    return nuevo;
  }

  private normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
}
