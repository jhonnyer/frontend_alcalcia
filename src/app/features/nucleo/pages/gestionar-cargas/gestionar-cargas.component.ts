import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ImportacionMasivaService } from '../../../../core/services/importacion-masiva.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ImportacionHistorica, ImportacionPendiente } from '../../../../core/models/importacion-masiva.model';

@Component({
  selector: 'app-gestionar-cargas',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './gestionar-cargas.component.html',
  styles: [`
    .load-tab { padding: .75rem 1rem; border-bottom: 2px solid transparent; color: #64748b; font-size: .875rem; font-weight: 600; }
    .load-tab:hover { color: #1d4ed8; background: #f8fafc; }
    .load-tab-active { border-bottom-color: #2563eb; color: #1d4ed8; }
    .load-count { display: inline-flex; min-width: 1.5rem; justify-content: center; margin-left: .35rem; border-radius: 9999px; background: #e2e8f0; padding: .125rem .4rem; font-size: .7rem; }
    .icon-button { display: inline-flex; height: 2rem; width: 2rem; align-items: center; justify-content: center; border-radius: .375rem; }
    .icon-button:hover { background: #fef2f2; }
  `],
})
export class GestionarCargasComponent implements OnInit {
  private readonly service = inject(ImportacionMasivaService);
  private readonly alert = inject(AlertService);
  readonly cargas = signal<ImportacionPendiente[]>([]);
  readonly historico = signal<ImportacionHistorica[]>([]);
  readonly cargando = signal(true);
  readonly cargandoHistorico = signal(false);
  readonly pestana = signal<'pendientes' | 'historico'>('pendientes');
  readonly filtroPendientes = signal('');
  readonly filtroHistorico = signal('');
  readonly paginaPendientes = signal(0);
  readonly paginaHistorico = signal(0);
  readonly tamanoPagina = 15;

  readonly pendientesFiltrados = computed(() => this.filtrarPendientes(this.filtroPendientes()));
  readonly historicoFiltrado = computed(() => this.filtrarHistorico(this.filtroHistorico()));
  readonly pendientesPagina = computed(() => this.pendientesFiltrados().slice(
    this.paginaPendientes() * this.tamanoPagina,
    (this.paginaPendientes() + 1) * this.tamanoPagina
  ));
  readonly historicoPagina = computed(() => this.historicoFiltrado().slice(
    this.paginaHistorico() * this.tamanoPagina,
    (this.paginaHistorico() + 1) * this.tamanoPagina
  ));
  readonly totalPaginasPendientes = computed(() => Math.max(1, Math.ceil(this.pendientesFiltrados().length / this.tamanoPagina)));
  readonly totalPaginasHistorico = computed(() => Math.max(1, Math.ceil(this.historicoFiltrado().length / this.tamanoPagina)));

  ngOnInit(): void {
    this.service.pendientes().subscribe({
      next: response => {
        this.cargas.set(response.respuesta ?? []);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudieron consultar las cargas', error?.error?.mensaje ?? 'Intenta nuevamente.');
      },
    });
    this.cargarHistorico();
  }

  private cargarHistorico(): void {
    this.cargandoHistorico.set(true);
    this.service.historial().subscribe({
      next: response => {
        this.historico.set(response.respuesta ?? []);
        this.cargandoHistorico.set(false);
      },
      error: error => {
        this.cargandoHistorico.set(false);
        this.alert.error('No se pudo consultar el histórico', error?.error?.mensaje ?? 'Intenta nuevamente.');
      },
    });
  }

  cambiarPestana(pestana: 'pendientes' | 'historico'): void {
    this.pestana.set(pestana);
  }

  cambiarFiltroPendientes(event: Event): void {
    this.filtroPendientes.set((event.target as HTMLInputElement).value);
    this.paginaPendientes.set(0);
  }

  cambiarFiltroHistorico(event: Event): void {
    this.filtroHistorico.set((event.target as HTMLInputElement).value);
    this.paginaHistorico.set(0);
  }

  paginaPendienteAnterior(): void { this.paginaPendientes.update(value => Math.max(0, value - 1)); }
  paginaPendienteSiguiente(): void { this.paginaPendientes.update(value => Math.min(this.totalPaginasPendientes() - 1, value + 1)); }
  paginaHistoricoAnterior(): void { this.paginaHistorico.update(value => Math.max(0, value - 1)); }
  paginaHistoricoSiguiente(): void { this.paginaHistorico.update(value => Math.min(this.totalPaginasHistorico() - 1, value + 1)); }

  async eliminar(carga: ImportacionPendiente): Promise<void> {
    const confirmado = await this.alert.confirm(
      'Eliminar carga pendiente',
      `Se eliminará la simulación "${carga.nombreArchivo}". No se han creado beneficiarios todavía.`,
      'Eliminar',
      'Cancelar'
    );
    if (!confirmado) return;

    this.service.eliminar(carga.importacionId).subscribe({
      next: () => {
        this.cargas.update(items => items.filter(item => item.importacionId !== carga.importacionId));
        this.alert.success('Carga eliminada', 'La simulación pendiente fue eliminada.');
      },
      error: error => this.alert.error('No se pudo eliminar la carga', error?.error?.mensaje ?? 'Intenta nuevamente.'),
    });
  }

  private filtrarPendientes(query: string): ImportacionPendiente[] {
    const normalized = query.trim().toLocaleLowerCase();
    return this.cargas().filter(carga => !normalized || [carga.nombreArchivo, carga.estado, carga.importacionId]
      .some(value => value?.toLocaleLowerCase().includes(normalized)));
  }

  private filtrarHistorico(query: string): ImportacionHistorica[] {
    const normalized = query.trim().toLocaleLowerCase();
    return this.historico().filter(carga => !normalized || [carga.nombreArchivo, carga.estado, carga.importacionId]
      .some(value => value?.toLocaleLowerCase().includes(normalized)));
  }
}
