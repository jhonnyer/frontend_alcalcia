import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from '../../../../core/services/alert.service';
import { ImportacionProyectosService } from '../../../../core/services/importacion-proyectos.service';
import { ImportacionProyectosResultado } from '../../../../core/models/importacion-proyectos.model';

@Component({
  selector: 'app-importacion-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-full bg-slate-50 p-4 sm:p-6">
      <header class="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <a routerLink="/projects" class="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">
            <mat-icon class="text-base">arrow_back</mat-icon>
            Proyectos
          </a>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Carga masiva de proyectos</h1>
          <p class="mt-1 max-w-3xl text-sm text-slate-600">
            Crea proyectos nuevos con sus categorías y productos. No modifica proyectos, categorías ni productos existentes.
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

      <main class="mx-auto mt-5 max-w-[1500px] space-y-4">
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
            Si el nombre de un proyecto ya existe, la carga no se puede confirmar. Las categorías se crean nuevas
            y pertenecen solo a su proyecto; los productos se crean dentro de su categoría.
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
              <strong [class]="r.errores.length ? 'text-red-700' : 'text-emerald-700'">{{ r.errores.length }}</strong>
            </div>
          </section>

          @if (r.errores.length) {
            <section class="rounded-xl border border-red-200 bg-white shadow-sm">
              <h2 class="border-b border-red-100 p-3 text-sm font-bold text-red-800">Errores a corregir en el Excel</h2>
              <div class="max-h-80 overflow-auto">
                <table class="w-full text-left text-xs">
                  <thead class="sticky top-0 bg-red-50 text-red-900">
                    <tr><th class="p-2">Fila</th><th class="p-2">Proyecto</th><th class="p-2">Campo</th><th class="p-2">Detalle</th></tr>
                  </thead>
                  <tbody>
                    @for (e of r.errores; track $index) {
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
            <h2 class="border-b border-slate-100 p-3 text-sm font-bold text-slate-700">Vista previa</h2>
            <div class="max-h-96 overflow-auto">
              <table class="w-full text-left text-xs">
                <thead class="sticky top-0 bg-slate-100 text-slate-700">
                  <tr>
                    <th class="p-2">Fila</th><th class="p-2">Proyecto</th><th class="p-2">Tipo</th>
                    <th class="p-2">Inicio</th><th class="p-2">Fin</th><th class="p-2">Categoría</th>
                    <th class="p-2">Producto</th><th class="p-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of r.filas; track f.numeroFila) {
                    <tr class="border-t border-slate-100">
                      <td class="p-2">{{ f.numeroFila }}</td>
                      <td class="p-2">{{ f.proyecto }}</td>
                      <td class="p-2">{{ f.tipoProyecto }}</td>
                      <td class="p-2">{{ f.fechaInicio }}</td>
                      <td class="p-2">{{ f.fechaFin }}</td>
                      <td class="p-2">{{ f.categoria }}</td>
                      <td class="p-2">{{ f.producto }}</td>
                      <td class="p-2">{{ f.stock }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          @if (!r.confirmada) {
            <div class="flex justify-end">
              <button type="button" class="btn-action-blue" [disabled]="!puedeConfirmar()" (click)="confirmar()">
                <mat-icon class="mr-1 text-base">check_circle</mat-icon>
                {{ r.errores.length ? 'Corrige los errores para confirmar' : 'Confirmar carga' }}
              </button>
            </div>
          }
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
  readonly archivoNombre = signal('');
  readonly cargando = signal(false);
  readonly descargandoPlantilla = signal(false);
  private archivo: File | null = null;

  readonly puedeConfirmar = computed(() => {
    const r = this.resultado();
    return !!r && !r.confirmada && r.errores.length === 0 && !this.cargando();
  });

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.alert.error('Archivo no válido', 'Selecciona un archivo Excel .xlsx.');
      return;
    }
    this.archivo = archivo;
    this.archivoNombre.set(archivo.name);
    this.cargando.set(true);
    this.service.simular(archivo).subscribe({
      next: res => {
        this.resultado.set(res.respuesta);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudo validar el archivo', this.mensajeError(error));
      },
    });
  }

  confirmar(): void {
    if (!this.archivo || !this.puedeConfirmar()) return;
    this.cargando.set(true);
    this.service.confirmar(this.archivo).subscribe({
      next: res => {
        this.resultado.set(res.respuesta);
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
    this.archivo = null;
    this.archivoNombre.set('');
  }

  private mensajeError(error: any): string {
    return error?.error?.mensaje ?? error?.error?.message ?? 'Revisa la respuesta del servidor.';
  }
}
