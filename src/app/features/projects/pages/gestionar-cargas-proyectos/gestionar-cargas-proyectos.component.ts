import { CommonModule } from '@angular/common';
import { finalize, Subscription, timeout } from 'rxjs';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ImportacionProyectosService } from '../../../../core/services/importacion-proyectos.service';
import { ImportacionProyectosHistorica } from '../../../../core/models/importacion-proyectos.model';
import { ServerPaginationComponent } from '../../../../shared/components/server-pagination/server-pagination.component';

@Component({
  selector: 'app-gestionar-cargas-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, ServerPaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gestionar-cargas-proyectos.component.html',
})
export class GestionarCargasProyectosComponent implements OnInit, OnDestroy {
  private readonly service = inject(ImportacionProyectosService);
  private peticion?: Subscription;
  private temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;

  readonly historico = signal<ImportacionProyectosHistorica[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly filtro = signal('');
  readonly paginaActual = signal(0);
  readonly tamanoPagina = signal(15);
  readonly tamanosPagina = [10, 15, 25, 50, 100];
  readonly totalElementos = signal(0);
  readonly totalPaginas = signal(1);

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.cancelarBusquedaPendiente();
    this.peticion?.unsubscribe();
  }

  rutaBorrador(carga: ImportacionProyectosHistorica): (string | number)[] {
    return carga.tipoOperacion === 'PROYECTOS'
      ? ['/projects/importacion-masiva']
      : ['/projects', carga.idProyecto ?? '', 'inventario', carga.tipoOperacion === 'ACTUALIZAR_INVENTARIO' ? 'actualizar' : 'importar'];
  }

  cargarDatos(): void {
    this.cancelarBusquedaPendiente();
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.errorCarga.set('');
    this.peticion = this.service.historial(this.paginaActual(), this.tamanoPagina(), this.filtro().trim())
      .pipe(timeout(45000), finalize(() => this.cargando.set(false))).subscribe({
        next: res => {
          const pagina = res.respuesta;
          const ultimaPagina = Math.max(0, pagina.totalPages - 1);
          if (this.paginaActual() > ultimaPagina) {
            this.paginaActual.set(ultimaPagina);
            this.cargarDatos();
            return;
          }
          this.historico.set(pagina.content);
          this.totalElementos.set(pagina.totalElements);
          this.totalPaginas.set(Math.max(1, pagina.totalPages));
        },
        error: error => {
          console.error('Error al consultar historial de proyectos:', error);
          this.errorCarga.set('No se pudo consultar el historial. La consulta falló o tardó demasiado.');
        },
      });
  }

  cambiarFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.paginaActual.set(0);
    this.cancelarBusquedaPendiente();
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.errorCarga.set('');
    this.temporizadorBusqueda = setTimeout(() => this.cargarDatos(), 300);
  }

  cambiarPagina(pagina: number): void {
    if (this.cargando() || pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
    this.cargarDatos();
  }

  cambiarTamanoPagina(event: Event): void {
    this.tamanoPagina.set(Number((event.target as HTMLSelectElement).value));
    this.paginaActual.set(0);
    this.cargarDatos();
  }

  private cancelarBusquedaPendiente(): void {
    if (this.temporizadorBusqueda !== null) {
      clearTimeout(this.temporizadorBusqueda);
      this.temporizadorBusqueda = null;
    }
  }
}
