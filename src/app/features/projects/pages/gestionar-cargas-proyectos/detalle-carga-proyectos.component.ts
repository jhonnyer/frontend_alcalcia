import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ImportacionProyectosDetalle } from '../../../../core/models/importacion-proyectos.model';
import { ImportacionProyectosService } from '../../../../core/services/importacion-proyectos.service';
import { ServerPaginationComponent } from '../../../../shared/components/server-pagination/server-pagination.component';

@Component({
  selector: 'app-detalle-carga-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, ServerPaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-carga-proyectos.component.html',
  styleUrls: ['./detalle-carga-proyectos.component.css'],
})
export class DetalleCargaProyectosComponent implements OnInit {
  private readonly service = inject(ImportacionProyectosService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly detalle = signal<ImportacionProyectosDetalle | null>(null);
  readonly cargando = signal(false);
  readonly errorCarga = signal('');
  readonly filtro = signal('');
  readonly paginaActual = signal(0);
  readonly tamanoPagina = signal(5);
  readonly opcionesPagina = [5, 10, 25, 50, 100];
  readonly esInventario = computed(() => this.detalle()?.carga.tipoOperacion !== 'PROYECTOS');
  readonly esActualizacion = computed(() => this.detalle()?.carga.tipoOperacion === 'ACTUALIZAR_INVENTARIO');
  readonly filtradas = computed(() => {
    const q = this.filtro().trim().toLocaleLowerCase();
    return (this.detalle()?.filas ?? []).filter(f => !q ||
      [f.proyecto, f.categoria, f.producto].some(v => v?.toLocaleLowerCase().includes(q)));
  });
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamanoPagina())));
  readonly pagina = computed(() =>
    this.filtradas().slice(this.paginaActual() * this.tamanoPagina(), (this.paginaActual() + 1) * this.tamanoPagina()));

  ngOnInit(): void {
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    if (this.cargando()) return;
    this.errorCarga.set('');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorCarga.set('El identificador de la carga no es válido.');
      return;
    }
    this.cargando.set(true);
    this.service.obtenerDetalle(id).pipe(
      timeout(45000), takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))
    ).subscribe({
      next: res => {
        this.detalle.set(res.respuesta);
        this.filtro.set('');
        this.paginaActual.set(0);
      },
      error: error => {
        console.error('Error al consultar detalle de carga:', error);
        const body: unknown = error instanceof HttpErrorResponse ? error.error : null;
        this.errorCarga.set(body && typeof body === 'object' && 'mensaje' in body && typeof body.mensaje === 'string'
          ? body.mensaje : 'No se pudo consultar el detalle. Revisa la conexión e inténtalo nuevamente.');
      },
    });
  }

  cambiarFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.paginaActual.set(0);
  }

  cambiarTamano(event: Event): void {
    this.tamanoPagina.set(Number((event.target as HTMLSelectElement).value));
    this.paginaActual.set(0);
  }
}
