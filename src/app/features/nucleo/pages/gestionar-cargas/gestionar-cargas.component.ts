import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
  }

  cambiarPestana(pestana: 'pendientes' | 'historico'): void {
    this.pestana.set(pestana);
    if (pestana === 'historico' && this.historico().length === 0) {
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
  }

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
}
