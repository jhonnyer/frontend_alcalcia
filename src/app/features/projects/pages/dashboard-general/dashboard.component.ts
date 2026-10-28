import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Subject, finalize, takeUntil, timeout } from 'rxjs';
import { dashboardLoadError } from '../../../../shared/components/dashboard-charts/dashboard-load.utils';
import { ReportesService } from '../../../../core/services/reportes.service';
import { DashboardReport } from '../../../../core/models/reporte-global/reportes.model';
import { hasDashboardData } from '../../../../core/models/reporte-global/dashboard.utils';
import { DashboardChartsComponent } from '../../../../shared/components/dashboard-charts/dashboard-charts.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, DashboardChartsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly reportes = inject(ReportesService);
  private readonly destroyRef = inject(DestroyRef);
  readonly hasDashboardData = hasDashboardData;
  readonly dashboard = signal<DashboardReport | null>(null);
  readonly loadError = signal('');
  readonly loading = signal(false);
  private readonly cancelLoad = new Subject<void>();

  @HostListener('window:offline')
  onOffline(): void {
    if (!this.loading()) return;
    this.cancelLoad.next();
    this.loadError.set('Se perdió la conexión. Puedes seguir navegando; reintenta cuando tengas señal.');
  }

  @HostListener('window:online')
  onOnline(): void {
    if (this.loadError()) this.loadDashboard();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    if (this.loading()) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.loadError.set('No hay conexión a internet. Puedes seguir navegando; las estadísticas se reintentarán cuando vuelva la conexión.');
      return;
    }
    this.loading.set(true);
    this.loadError.set('');
    this.reportes.obtenerDashboard().pipe(
      timeout(15000),
      takeUntil(this.cancelLoad),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: dashboard => this.dashboard.set(dashboard),
      error: error => {
        console.error('Error al cargar el dashboard de inicio:', error);
        this.loadError.set(dashboardLoadError(error));
      }
    });
  }
}
