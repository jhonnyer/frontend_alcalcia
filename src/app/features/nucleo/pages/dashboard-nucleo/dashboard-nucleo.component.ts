import { Component, OnInit, inject, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartType } from 'chart.js';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { NucleoDetallado } from '../../../../core/models/nucleo-detallado.model';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ActivatedRoute, Router } from '@angular/router';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard-nucleo.component.html',
  styleUrl: './dashboard-nucleo.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly pageTitleService = inject(PageTitleService);
  private route = inject(ActivatedRoute);
  private nucleoService = inject(NucleoService);
  private router = inject(Router);
  nucleo?: NucleoDetallado; 
  allData?: NucleoDetallado;
  isLoadingPDF = false;

  @ViewChild('chartActas', { static: false }) chartActas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBenef', { static: false }) chartBenef!: ElementRef<HTMLCanvasElement>;

  loading = true;

  // KPIs
  proyectosActivos = 0;
  totalBeneficiarios = 0;
  totalNucleos = 0;
  totalActas = 0;
  actasEntregadas = 0;
  filtroEstadoRapido = 'TODOS';
  filtroEdadRapido = 'TODOS';

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

  // Gráfica: Actas por estado
  chartActasType: ChartType = 'pie';
  chartActasData: ChartConfiguration['data'] = {
    labels: Object.values(this.estadoLabels),
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'],
      borderWidth: 1,
      hoverOffset: 8
    }]
  };
  
  chartActasOptions: ChartConfiguration['options'] = {
    responsive: true,
    layout: { padding: { bottom: 30 } },
    plugins: {
        legend: {
        position: 'bottom',
        fullSize: true,
        align: 'center',
        maxWidth: 500,
        labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            textAlign: 'left',
            boxWidth: 14,
            padding: 18,
            font: { size: 13, family: 'sans-serif'},
            color: '#374151',
            // ✅ versión tipada y segura
            generateLabels: (chart: any) => {
                const dataset = chart.data.datasets?.[0];
                const bgColors: string[] = (dataset?.backgroundColor as string[]) || [];
                const labels: string[] = (chart.data.labels as string[]) || [];
                const data: number[] = (dataset?.data as number[]) || [];

                return labels.map((label: string, i: number) => ({
                    text: label,
                    fillStyle: bgColors[i] || '#ccc',
                    strokeStyle: bgColors[i] || '#ccc',
                    lineWidth: 0,
                    hidden: false, 
                    index: i
                }));
            }
        }
        },
        datalabels: {
        color: '#fff',
        font: { weight: 'bold' },
        formatter: (value: number, ctx: any) => {
            const total = (ctx.chart.data.datasets?.[0].data as number[]).reduce(
            (a, b) => a + b,
            0
            );
          if (!total) return '0%';
            const porcentaje = ((value / total) * 100).toFixed(1);
            return `${porcentaje}%`;
        }
        },
        tooltip: {
        callbacks: {
            label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
            }
        }
        }
    }
    };


  // Gráfica: Beneficiarios por rango de edad
  chartBenefType: ChartType = 'bar';
  chartBenefData: ChartConfiguration['data'] = {
    labels: ['0-12', '13-17', '18-29', '30-59', '60+'],
    datasets: [{
      label: 'Beneficiarios',
      data: [0, 0, 0, 0, 0],
      backgroundColor: '#3b82f6'
    }]
  };

  chartBenefOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: { y: { beginAtZero: true } }
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // Intentar leer el núcleo desde el estado de navegación
    const nav = this.router.getCurrentNavigation();
    this.nucleo = nav?.extras.state?.['nucleo'] ?? history.state['nucleo'];

    // Si vino por navegación, usamos esa data y evitamos request duplicado.
    if (this.nucleo) {
      this.aplicarDatosDashboard(this.nucleo);
      this.loading = false;
    } else {
      this.nucleoService.obtenerDetalleNucleo(id).subscribe({
        next: ({ respuesta }) => {
          const fallback = respuesta || {
            idNucleo: id,
            nombreNucleo: 'Sin nombre',
            direccion: '—',
            nombreZona: '—',
            nombreBarrio: '—',
            numeroIntegrantes: 0,
            beneficiariosNucleo: [],
            beneficiariosProyecto: [],
            actas: []
          };
          this.aplicarDatosDashboard(fallback);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando actor social', err);
          this.loading = false;
        }
      });
    }

    this.pageTitleService.setCurrentPage('Dashboard');
  }

  private aplicarDatosDashboard(data: NucleoDetallado) {
    this.nucleo = data;
    this.allData = data;
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
      return this.filtroEstadoRapido === 'TODOS' && this.filtroEdadRapido === 'TODOS';
    }

    if (target === 'beneficiarios') {
      return this.filtroEdadRapido !== 'TODOS';
    }

    if (target === 'actas') {
      return this.filtroEstadoRapido === 'TODOS';
    }

    return this.filtroEstadoRapido === 'E';
  }

  private recalcularDashboard() {
    if (!this.allData) return;

    const actasFiltradas = this.getActasFiltradas(this.allData.actas);
    const beneficiariosFiltrados = this.getBeneficiariosFiltrados(this.allData.beneficiariosNucleo);

    // KPIs
    this.totalNucleos = 1;
    this.totalBeneficiarios = beneficiariosFiltrados.length;
    this.proyectosActivos = this.allData.beneficiariosProyecto.filter(p => p.esBeneficiarioActivo).length;
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
    const edades = beneficiariosFiltrados.map(b => b.edad ?? 0);
    this.chartBenefData = {
      labels: ['0-12', '13-17', '18-29', '30-59', '60+'],
      datasets: [{
        label: 'Beneficiarios',
        data: this.bucketEdades(edades),
        backgroundColor: '#3b82f6'
      }]
    };
  }

  private getActasFiltradas(actas: NucleoDetallado['actas']) {
    if (this.filtroEstadoRapido === 'TODOS') return actas;
    return actas.filter((acta) => acta.estado === this.filtroEstadoRapido);
  }

  private getBeneficiariosFiltrados(beneficiarios: NucleoDetallado['beneficiariosNucleo']) {
    switch (this.filtroEdadRapido) {
      case '0-12':
        return beneficiarios.filter((b) => (b.edad ?? 0) <= 12);
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

  private bucketEdades(edades: number[]) {
    const b = [0, 0, 0, 0, 0];
    for (const e of edades) {
      if (e <= 12) b[0]++;
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
    if (this.isLoadingPDF) return;

    const dashboard = document.querySelector('.dashboard-container') as HTMLElement;
    if (!dashboard) return;

    this.isLoadingPDF = true;

    // ✅ Guardar estilos originales para restaurar luego
    const originalMaxHeight = dashboard.style.maxHeight;
    const originalOverflow = dashboard.style.overflowY;

    try {
      // 🔓 Quitar límites para capturar todo
      dashboard.style.maxHeight = 'none';
      dashboard.style.overflowY = 'visible';
      dashboard.classList.add('export-pdf');

      // Permite al navegador pintar el estado del boton antes del trabajo pesado.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => setTimeout(() => resolve(), 0));
      });

      // 📸 Capturar todo el contenido visible
      const canvas = await html2canvas(dashboard, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollY: -window.scrollY,
        windowWidth: dashboard.scrollWidth,
        windowHeight: dashboard.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pageHeight = 297;
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 📁 Nombre del archivo con nombre del núcleo
      const nombreNucleo = this.nucleo?.nombreNucleo?.trim().replace(/\s+/g, '_') || 'SinNombre';
      pdf.save(`actorSocial-${nombreNucleo}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    } finally {
      // 🔙 Restaurar estilos originales
      dashboard.style.maxHeight = originalMaxHeight;
      dashboard.style.overflowY = originalOverflow;
      dashboard.classList.remove('export-pdf');
      this.isLoadingPDF = false;
    }
  }

  zoomLevel = signal(1); // 1 = 100%
    readonly MIN_ZOOM = 0.7;
    readonly MAX_ZOOM = 1.5;
    readonly STEP_ZOOM = 0.05;
  
  increaseZoom() {
    this.zoomLevel.update(z => Math.min(this.MAX_ZOOM, parseFloat((z + this.STEP_ZOOM).toFixed(2))));
  }
  
  decreaseZoom() {
    this.zoomLevel.update(z => Math.max(this.MIN_ZOOM, parseFloat((z - this.STEP_ZOOM).toFixed(2))));
  }
  
  resetZoom() {
    this.zoomLevel.set(1);
  }

}