import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject, finalize, takeUntil, timeout } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { DashboardChartComponent } from '../../../../shared/components/dashboard-charts/dashboard-chart.component';
import { dashboardLoadError } from '../../../../shared/components/dashboard-charts/dashboard-load.utils';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { NucleoDetallado } from '../../../../core/models/nucleo-detallado.model';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportesPdfService } from '../../../../core/services/reportes-pdf.service';
import { AlertService } from '../../../../core/services/alert.service';
import { pdfErrorMessage } from '../../../../shared/components/pdf/pdf-export.utils';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-list-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatButtonModule,
    FormsModule,
    DashboardChartComponent
  ],
  templateUrl: './dashboard-nucleo.component.html',
  styleUrl: './dashboard-nucleo.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly pageTitleService = inject(PageTitleService);
  private route = inject(ActivatedRoute);
  private nucleoService = inject(NucleoService);
  private router = inject(Router);
  private readonly pdf = inject(ReportesPdfService);
  private readonly alert = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  nucleo?: NucleoDetallado; 
  allData?: NucleoDetallado;
  isLoadingPDF = false;

  loading = false;
  private readonly cancelLoad = new Subject<void>();
  private retryOnConnection = false;

  @HostListener('window:offline')
  onOffline(): void {
    if (!this.loading) return;
    this.cancelLoad.next();
    this.retryOnConnection = true;
    this.loadError = 'Se perdió la conexión. Puedes seguir navegando; reintenta cuando tengas señal.';
  }

  @HostListener('window:online')
  onOnline(): void {
    if (this.retryOnConnection) this.loadData();
  }

  // KPIs
  proyectosActivos = 0;
  totalBeneficiarios = 0;
  totalNucleos = 0;
  totalActas = 0;
  actasEntregadas = 0;
  filtroEstadoRapido = 'TODOS';
  filtroEdadRapido = 'TODOS';
  filtroAnio: number | null = null;
  filtroMes: number | null = null;
  fechaActa: 'CREACION' | 'ENTREGA' = 'CREACION';
  readonly meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Mapeo de estados
  readonly estadoLabels: Record<string, string> = {
    P: 'Pendiente',
    R: 'Recibido',
    A: 'Autorizado',
    E: 'Entregado',
    RC: 'Rechazado'
  };
  readonly estadoOrden = ['P', 'R', 'A', 'E', 'RC'];
  readonly rangoEdadOptions = ['TODOS', '0-12', '13-17', '18-29', '30-59', '60+'];
  readonly rangoEdadLabels = ['0-12', '13-17', '18-29', '30-59', '60+'];

  // Gráfica: Actas por estado
  chartActasType = 'doughnut' as const;
  chartActasData: ChartData<'doughnut'> = {
    labels: Object.values(this.estadoLabels),
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'],
      borderWidth: 1,
      hoverOffset: 8
    }]
  };
  
  chartActasOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    devicePixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2),
    cutout: '58%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14, boxWidth: 10 } },
      datalabels: { display: false },
      tooltip: { callbacks: { label: context => `${context.label}: ${context.raw} actas` } }
    }
  };


  // Gráfica: Beneficiarios por rango de edad
  chartBenefType = 'bar' as const;
  chartBenefData: ChartData<'bar'> = {
    labels: ['0-12', '13-17', '18-29', '30-59', '60+'],
    datasets: [{
      label: 'Beneficiarios',
      data: [0, 0, 0, 0, 0],
      backgroundColor: '#3b82f6'
    }]
  };

  chartBenefOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    devicePixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2),
    plugins: { legend: { display: false }, datalabels: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
  };

  ngOnInit() {
    this.loadData();
    this.pageTitleService.setCurrentPage('Dashboard');
  }

  loadError = '';

  loadData(): void {
    if (this.loading) return;
    this.loading = true;
    this.loadError = '';
    this.retryOnConnection = false;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.loadError = 'El identificador del actor social no es válido.';
      this.loading = false;
      return;
    }

    // Intentar leer el núcleo desde el estado de navegación
    const nav = this.router.getCurrentNavigation();
    this.nucleo = nav?.extras.state?.['nucleo'] ?? history.state?.['nucleo'];

    // Si vino por navegación, usamos esa data y evitamos request duplicado.
    if (this.nucleo?.idNucleo === id) {
      this.aplicarDatosDashboard(this.nucleo);
      this.loading = false;
    } else {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.loading = false;
        this.retryOnConnection = true;
        this.loadError = 'No hay conexión a internet. Puedes seguir navegando; las estadísticas se reintentarán cuando vuelva la conexión.';
        return;
      }
      this.nucleoService.obtenerDetalleNucleo(id).pipe(
        timeout(15000), takeUntil(this.cancelLoad), takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false)
      ).subscribe({
        next: ({ respuesta }) => {
          if (!respuesta) {
            this.loadError = 'No se encontró el actor social solicitado.';
            return;
          }
          this.aplicarDatosDashboard(respuesta);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando actor social', err);
          this.retryOnConnection = true;
          this.loadError = dashboardLoadError(err);
          this.loading = false;
        }
      });
    }

  }

  private aplicarDatosDashboard(data: NucleoDetallado) {
    const normalized = {
      ...data,
      actas: data.actas ?? [],
      beneficiariosNucleo: data.beneficiariosNucleo ?? [],
      beneficiariosProyecto: data.beneficiariosProyecto ?? []
    };
    this.nucleo = normalized;
    this.allData = normalized;
    this.recalcularDashboard();
  }

  onEstadoRapidoChange(estado: string): void {
    this.filtroEstadoRapido = estado;
    this.recalcularDashboard();
  }

  onEdadRapidoChange(): void {
    this.recalcularDashboard();
  }

  clearQuickFilters(): void {
    this.filtroEstadoRapido = 'TODOS';
    this.filtroEdadRapido = 'TODOS';
    this.filtroAnio = this.filtroMes = null;
    this.fechaActa = 'CREACION';
    this.recalcularDashboard();
  }

  clearEstadoFilter(): void {
    this.filtroEstadoRapido = 'TODOS';
    this.recalcularDashboard();
  }

  clearEdadFilter(): void {
    this.filtroEdadRapido = 'TODOS';
    this.recalcularDashboard();
  }

  onActasChartClick(event: { active?: object[] }): void {
    const index = this.indiceGrafica(event);
    if (index === undefined) return;

    const estado = this.estadoOrden[index] ?? 'TODOS';
    this.filtroEstadoRapido = this.filtroEstadoRapido === estado ? 'TODOS' : estado;
    this.recalcularDashboard();
  }

  onBenefChartClick(event: { active?: object[] }): void {
    const index = this.indiceGrafica(event);
    if (index === undefined) return;
    const rango = this.rangoEdadLabels[index];
    if (!rango) return;
    this.filtroEdadRapido = this.filtroEdadRapido === rango ? 'TODOS' : rango;
    this.recalcularDashboard();
  }

  onKpiCardClick(target: 'overview' | 'beneficiarios' | 'actas' | 'actasEntregadas'): void {
    if (target === 'overview') {
      this.clearQuickFilters();
      return;
    }

    if (target === 'beneficiarios') {
      this.filtroEdadRapido = 'TODOS';
      this.recalcularDashboard();
      return;
    }

    if (target === 'actas') {
      this.filtroEstadoRapido = 'TODOS';
      this.recalcularDashboard();
      return;
    }

    // Toggle rápido entre "solo entregadas" y "todas"
    this.filtroEstadoRapido = this.filtroEstadoRapido === 'E' ? 'TODOS' : 'E';
    this.recalcularDashboard();
  }

  isKpiActive(target: 'overview' | 'beneficiarios' | 'actas' | 'actasEntregadas'): boolean {
    if (target === 'overview') {
      return this.filtroEstadoRapido === 'TODOS' && this.filtroEdadRapido === 'TODOS' && this.filtroAnio === null;
    }

    if (target === 'beneficiarios') {
      return this.filtroEdadRapido !== 'TODOS';
    }

    if (target === 'actas') {
      return this.filtroEstadoRapido === 'TODOS';
    }

    return this.filtroEstadoRapido === 'E';
  }

  get porcentajeActasEntregadas(): number {
    if (!this.totalActas) return 0;
    return Math.round((this.actasEntregadas / this.totalActas) * 100);
  }

  get hasEstadoFilter(): boolean {
    return this.filtroEstadoRapido !== 'TODOS';
  }

  get hasEdadFilter(): boolean {
    return this.filtroEdadRapido !== 'TODOS';
  }

  get estadoFiltroLabel(): string {
    if (!this.hasEstadoFilter) return 'Todas';
    return this.estadoLabels[this.filtroEstadoRapido] ?? this.filtroEstadoRapido;
  }

  private recalcularDashboard() {
    if (!this.allData) return;

    const actasFiltradas = this.getActasFiltradas(this.allData.actas);
    const beneficiariosFiltrados = this.getBeneficiariosFiltrados(this.allData.beneficiariosNucleo);

    // KPIs
    this.totalNucleos = 1;
    this.totalBeneficiarios = beneficiariosFiltrados.length;
    this.proyectosActivos = new Set(this.allData.beneficiariosProyecto
      .filter(p => p.esBeneficiarioActivo && p.estadoProyecto === 'A').map(p => p.idProyecto)).size;
    this.totalActas = actasFiltradas.length;
    this.actasEntregadas = actasFiltradas.filter(a => a.estado === 'E').length;

    // === Gráfica: Actas por estado ===
    const conteo = this.contarEstados(actasFiltradas.map(a => a.estado));
    this.chartActasData = {
      labels: this.estadoOrden.map(k => this.estadoLabels[k]),
      datasets: [{
        data: this.estadoOrden.map(k => conteo[k] ?? 0),
        backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'],
        borderWidth: 1,
        hoverOffset: 8
      }]
    };

    // === Gráfica: Beneficiarios por rango de edad ===
    const edades = beneficiariosFiltrados.map(b => b.edad);
    this.chartBenefData = {
      labels: ['0-12', '13-17', '18-29', '30-59', '60+', 'Sin edad registrada'],
      datasets: [{
        label: 'Beneficiarios',
        data: this.bucketEdades(edades),
        backgroundColor: '#3b82f6'
      }]
    };
  }

  private getActasFiltradas(actas: NucleoDetallado['actas']) {
    return actas.filter(acta => {
      if (this.filtroEstadoRapido !== 'TODOS' && acta.estado !== this.filtroEstadoRapido) return false;
      if (this.filtroAnio === null) return true;
      const fecha = this.fechaActa === 'ENTREGA' ? acta.fechaEntrega : acta.fechaCreacion;
      return fecha?.slice(0, 4) === String(this.filtroAnio)
        && (this.filtroMes === null || Number(fecha.slice(5, 7)) === this.filtroMes);
    });
  }

  private getBeneficiariosFiltrados(beneficiarios: NucleoDetallado['beneficiariosNucleo']) {
    switch (this.filtroEdadRapido) {
      case '0-12':
        return beneficiarios.filter((b) => b.edad != null && b.edad >= 0 && b.edad <= 12);
      case '13-17':
        return beneficiarios.filter((b) => (b.edad ?? 0) >= 13 && (b.edad ?? 0) <= 17);
      case '18-29':
        return beneficiarios.filter((b) => (b.edad ?? 0) >= 18 && (b.edad ?? 0) <= 29);
      case '30-59':
        return beneficiarios.filter((b) => (b.edad ?? 0) >= 30 && (b.edad ?? 0) <= 59);
      case '60+':
        return beneficiarios.filter((b) => (b.edad ?? 0) >= 60);
      default:
        return beneficiarios;
    }
  }

  private contarEstados(estados: string[]) {
    return estados.reduce((acc, e) => {
      acc[e] = (acc[e] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private bucketEdades(edades: Array<number | undefined>) {
    const b = [0, 0, 0, 0, 0, 0];
    for (const e of edades) {
      if (e == null || !Number.isFinite(e) || e < 0) b[5]++;
      else if (e <= 12) b[0]++;
      else if (e <= 17) b[1]++;
      else if (e <= 29) b[2]++;
      else if (e <= 59) b[3]++;
      else b[4]++;
    }
    return b;
  }

  volver(): void {
    this.router.navigate(["nucleo"]);
  }

  async exportarPDF() {
    if (this.isLoadingPDF || !this.nucleo) return;
    this.isLoadingPDF = true;
    try {
      await this.pdf.actor(this.nucleo.idNucleo, {
        estadoActa: this.filtroEstadoRapido === 'TODOS' ? [] : [this.filtroEstadoRapido],
        rangoEdad: this.filtroEdadRapido,
        ...this.periodoActas(),
        fechaActa: this.fechaActa,
      }, true);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.alert.error('No se pudo exportar el PDF', pdfErrorMessage(error));
    } finally {
      this.isLoadingPDF = false;
    }
  }

  get aniosActas(): number[] {
    const fechas = (this.allData?.actas ?? []).map(acta =>
      this.fechaActa === 'ENTREGA' ? acta.fechaEntrega : acta.fechaCreacion);
    return [...new Set(fechas.filter((fecha): fecha is string => !!fecha)
      .map(fecha => Number(fecha.slice(0, 4))).filter(Number.isInteger))].sort((a, b) => b - a);
  }

  cambiarPeriodo(): void {
    if (this.filtroAnio === null) this.filtroMes = null;
    this.recalcularDashboard();
  }

  cambiarFechaActa(): void {
    if (this.filtroAnio !== null && !this.aniosActas.includes(this.filtroAnio)) {
      this.filtroAnio = this.filtroMes = null;
    }
    this.recalcularDashboard();
  }

  private periodoActas(): { alcance: string; fechaInicio?: string; fechaFin?: string } {
    if (this.filtroAnio === null) return { alcance: 'ALL' };
    const mes = this.filtroMes;
    const mm = String(mes ?? 1).padStart(2, '0');
    const ultimoDia = mes === null ? 31 : new Date(this.filtroAnio, mes, 0).getDate();
    return {
      alcance: mes === null ? 'YEAR' : 'MONTH',
      fechaInicio: `${this.filtroAnio}-${mm}-01`,
      fechaFin: `${this.filtroAnio}-${mes === null ? '12' : mm}-${ultimoDia}`
    };
  }

  private indiceGrafica(event: { active?: object[] }): number | undefined {
    const punto = event.active?.[0];
    return punto && 'index' in punto && typeof punto.index === 'number' ? punto.index : undefined;
  }

}