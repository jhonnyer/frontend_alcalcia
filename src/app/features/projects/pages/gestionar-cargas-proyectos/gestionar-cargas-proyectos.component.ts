import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ImportacionProyectosService } from '../../../../core/services/importacion-proyectos.service';
import { ImportacionProyectosHistorica } from '../../../../core/models/importacion-proyectos.model';

@Component({
  selector: 'app-gestionar-cargas-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-full bg-slate-50 p-4 sm:p-6">
      <header class="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <a routerLink="/projects" class="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
            <mat-icon class="text-base">arrow_back</mat-icon>
            Proyectos
          </a>
          <h1 class="text-2xl font-bold text-slate-900">Gestionar cargas de proyectos</h1>
          <p class="mt-1 text-sm text-slate-600">Historial de cargas masivas confirmadas en esta secretaría.</p>
        </div>
        <a routerLink="/projects/importacion-masiva" class="btn-action-blue">
          <mat-icon class="mr-1 text-base">upload_file</mat-icon>
          Nueva carga
        </a>
      </header>

      <main class="mx-auto mt-5 max-w-[1200px]">
        @if (cargando()) {
          <div class="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">Consultando historial...</div>
        } @else if (errorCarga()) {
          <div role="alert" class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p>{{ errorCarga() }}</p>
            <button type="button" class="btn-action-blue mt-3" (click)="cargarDatos()">Reintentar</button>
          </div>
        } @else if (historico().length === 0) {
          <div class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
            Aún no hay cargas de proyectos confirmadas.
          </div>
        } @else {
          <div class="mb-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
            <label class="flex flex-1 flex-col gap-1 text-sm font-semibold text-slate-700 sm:max-w-md">
              Buscar
              <input class="input-base" placeholder="Archivo, usuario o proyecto" (input)="cambiarFiltro($event)" />
            </label>
            <span class="text-xs text-slate-500">{{ filtrado().length }} resultados</span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table class="w-full min-w-[900px] text-left text-sm">
              <thead class="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th class="p-3">Archivo</th><th class="p-3">Usuario</th><th class="p-3">Fecha</th>
                  <th class="p-3">Proyectos</th><th class="p-3">Categorías</th><th class="p-3">Productos</th>
                  <th class="p-3">Proyectos creados</th>
                </tr>
              </thead>
              <tbody>
                @for (carga of pagina(); track carga.idImportacion) {
                  <tr class="border-t border-slate-100 align-top">
                    <td class="p-3">{{ carga.nombreArchivo }}</td>
                    <td class="p-3">{{ carga.usuario }}</td>
                    <td class="p-3 whitespace-nowrap">{{ carga.fechaConfirmacion | date:'yyyy-MM-dd HH:mm' }}</td>
                    <td class="p-3">{{ carga.totalProyectos }}</td>
                    <td class="p-3">{{ carga.totalCategorias }}</td>
                    <td class="p-3">{{ carga.totalProductos }}</td>
                    <td class="p-3 text-xs text-slate-600">{{ carga.proyectosCreados }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span>Página {{ paginaActual() + 1 }} de {{ totalPaginas() }}</span>
            <div class="flex gap-2">
              <button type="button" class="btn-action-gray" (click)="anterior()" [disabled]="paginaActual() === 0">Anterior</button>
              <button type="button" class="btn-action-gray" (click)="siguiente()" [disabled]="paginaActual() >= totalPaginas() - 1">Siguiente</button>
            </div>
          </div>
        }
      </main>
    </section>
  `,
})
export class GestionarCargasProyectosComponent implements OnInit {
  private readonly service = inject(ImportacionProyectosService);

  readonly historico = signal<ImportacionProyectosHistorica[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly filtro = signal('');
  readonly paginaActual = signal(0);
  readonly tamanoPagina = 15;

  readonly filtrado = computed(() => {
    const q = this.filtro().trim().toLocaleLowerCase();
    return this.historico().filter(c => !q ||
      [c.nombreArchivo, c.usuario, c.proyectosCreados].some(v => v?.toLocaleLowerCase().includes(q)));
  });
  readonly pagina = computed(() =>
    this.filtrado().slice(this.paginaActual() * this.tamanoPagina, (this.paginaActual() + 1) * this.tamanoPagina));
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrado().length / this.tamanoPagina)));

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.service.historial().pipe(timeout(45000), finalize(() => this.cargando.set(false))).subscribe({
      next: res => {
        this.historico.set(res.respuesta ?? []);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        console.error('Error al consultar historial de proyectos:', error);
        this.errorCarga.set('No se pudo consultar el historial. La consulta falló o tardó demasiado.');
      },
    });
  }

  cambiarFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.paginaActual.set(0);
  }

  anterior(): void { this.paginaActual.update(v => Math.max(0, v - 1)); }
  siguiente(): void { this.paginaActual.update(v => Math.min(this.totalPaginas() - 1, v + 1)); }
}
