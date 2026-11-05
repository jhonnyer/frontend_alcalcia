import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ResumenImportacionOperativa, TipoImportacionOperativa } from '../../core/models/importacion-operativa.model';
import { AlertService } from '../../core/services/alert.service';
import { ImportacionOperativaService } from '../../core/services/importacion-operativa.service';
import { PageTitleService } from '../../core/services/pageTitle.service';

@Component({
  selector: 'app-gestionar-cargas-operativas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './gestionar-cargas-operativas.component.html',
  styles: [`
    @media (max-width: 767px) {
      .tabla-cargas { min-width: 0; width: 100%; }
      .tabla-cargas, .tabla-cargas tbody { display: block; }
      .tabla-cargas thead { display: none; }
      .tabla-cargas tr {
        display: block;
        margin-bottom: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        padding: 0.5rem;
      }
      .tabla-cargas td {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.5rem;
        overflow-wrap: anywhere;
      }
      .tabla-cargas td[data-label]::before {
        content: attr(data-label);
        font-weight: 600;
        color: #475569;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionarCargasOperativasComponent {
  private readonly service = inject(ImportacionOperativaService);
  private readonly alert = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  readonly tipo: TipoImportacionOperativa = inject(ActivatedRoute).snapshot.data['tipoImportacion'] === 'ACTAS'
    ? 'ACTAS' : 'ASOCIACIONES';
  readonly titulo = this.tipo === 'ACTAS' ? 'Gestionar cargas de actas' : 'Gestionar cargas de beneficiarios por proyecto';
  readonly rutaCarga = this.tipo === 'ACTAS'
    ? '/proceedings/importacion-masiva' : '/projects/add-beneficiary/importacion-masiva';
  readonly volver = this.tipo === 'ACTAS' ? '/proceedings' : '/projects/add-beneficiary/list';
  readonly cargas = signal<ResumenImportacionOperativa[]>([]);
  readonly cargando = signal(false);
  readonly eliminando = signal<string | null>(null);
  readonly errorCarga = signal('');
  readonly pestana = signal<'pendientes' | 'historial'>('pendientes');
  readonly filtro = signal('');
  readonly pagina = signal(0);
  readonly tamanoPagina = 15;
  readonly pendientes = computed(() => this.cargas().filter(c => c.estado === 'VALIDADA'));
  readonly historico = computed(() => this.cargas().filter(c => c.estado !== 'VALIDADA'));
  readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLocaleLowerCase();
    return (this.pestana() === 'pendientes' ? this.pendientes() : this.historico())
      .filter(c => !texto || [c.nombreArchivo, c.estado, c.id].some(v => v.toLocaleLowerCase().includes(texto)));
  });
  readonly paginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamanoPagina)));
  readonly paginaActual = computed(() => Math.min(this.pagina(), this.paginas() - 1));
  readonly filasPagina = computed(() => this.filtradas().slice(
    this.paginaActual() * this.tamanoPagina, (this.paginaActual() + 1) * this.tamanoPagina));

  constructor() {
    inject(PageTitleService).setCurrentPage(this.titulo);
    this.cargar();
  }

  cargar(): void {
    if (this.cargando() || this.eliminando()) return;
    this.cargando.set(true);
    this.errorCarga.set('');
    this.service.historial(this.tipo).pipe(timeout(45000), takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando.set(false))).subscribe({
      next: respuesta => this.cargas.set(respuesta.respuesta),
      error: error => this.mostrarError(error),
    });
  }

  cambiarPestana(pestana: 'pendientes' | 'historial'): void {
    this.pestana.set(pestana);
    this.filtro.set('');
    this.pagina.set(0);
  }

  buscar(texto: string): void { this.filtro.set(texto); this.pagina.set(0); }

  async eliminar(carga: ResumenImportacionOperativa): Promise<void> {
    if (this.cargando() || this.eliminando() || carga.estado === 'CONFIRMADA') return;
    const confirmado = await this.alert.confirm('Eliminar carga pendiente',
      `¿Eliminar "${carga.nombreArchivo}"? No se eliminarán beneficiarios, asociaciones ni actas.`,
      'Eliminar', 'Cancelar');
    if (!confirmado || this.cargando() || this.eliminando()) return;
    this.eliminando.set(carga.id);
    this.errorCarga.set('');
    this.service.eliminar(this.tipo, carga.id).pipe(timeout(45000), takeUntilDestroyed(this.destroyRef),
      finalize(() => this.eliminando.set(null))).subscribe({
      next: () => {
        this.cargas.update(lista => lista.filter(c => c.id !== carga.id));
        this.alert.success('Carga eliminada', 'La carga pendiente fue eliminada.');
      },
      error: error => this.mostrarError(error),
    });
  }

  private mostrarError(error: unknown): void {
    console.error('Error al gestionar cargas operativas:', error);
    const detalle: unknown = error instanceof HttpErrorResponse ? error.error : null;
    const mensaje = typeof detalle === 'object' && detalle !== null && 'mensaje' in detalle
      && typeof detalle.mensaje === 'string' ? detalle.mensaje : 'No se pudo completar la operación. Reintenta la consulta.';
    this.errorCarga.set(mensaje);
    this.alert.error('Error al gestionar cargas', mensaje);
  }
}
