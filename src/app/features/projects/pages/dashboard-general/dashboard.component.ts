import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
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

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');
    this.reportes.obtenerDashboard().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: dashboard => this.dashboard.set(dashboard),
      error: error => {
        console.error('Error al cargar el dashboard de inicio:', error);
        this.loadError.set('No se pudo cargar la información. La consulta falló o tardó demasiado. Puedes reintentar o continuar en otro módulo.');
      }
    });
  }
}
