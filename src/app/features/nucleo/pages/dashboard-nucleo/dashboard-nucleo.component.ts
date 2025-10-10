import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartType } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { NucleoDetallado } from '../../../../core/models/nucleo-detallado.model';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ActivatedRoute, Router } from '@angular/router';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-list-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
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

  @ViewChild('chartActas', { static: false }) chartActas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBenef', { static: false }) chartBenef!: ElementRef<HTMLCanvasElement>;

  loading = true;

  // KPIs
  proyectosActivos = 0;
  totalBeneficiarios = 0;
  totalNucleos = 0;
  actasEntregadas = 0;

  // Mapeo de estados
  readonly estadoLabels: Record<string, string> = {
    P: 'Pendiente',
    R: 'Recibido',
    A: 'Autorizado',
    E: 'Entregado',
    RC: 'Rechazado'
  };

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

    // Si no vino el núcleo (recarga o acceso directo)
    if (!this.nucleo) {
      this.nucleoService.obtenerDetalleNucleo(id).subscribe({
        next: ({ respuesta }) => {
          this.nucleo = respuesta || {
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
        },
        error: (err) => console.error('Error cargando núcleo', err)
      });
    }

    this.pageTitleService.setCurrentPage('Dashboard');
    this.cargarDatos(id);
  }


  // === Cargar datos reales del servicio ===
  private cargarDatos(id: number) {
    const idNucleo = id; // puedes hacerlo dinámico según el usuario
    this.nucleoService.obtenerDetalleNucleo(idNucleo).subscribe({
      next: ({ respuesta }) => this.procesarDatos(respuesta),
      error: (err) => {
        console.error('Error cargando datos del núcleo:', err);
        this.loading = false;
      }
    });
  }

  private procesarDatos(data: NucleoDetallado) {
    // KPIs
    this.totalNucleos = 1;
    this.totalBeneficiarios = data.beneficiariosNucleo.length;
    this.proyectosActivos = data.beneficiariosProyecto.filter(p => p.esBeneficiarioActivo).length;
    this.actasEntregadas = data.actas.filter(a => a.estado === 'E').length;

    // === Gráfica: Actas por estado ===
    const conteo = this.contarEstados(data.actas.map(a => a.estado));
    const orden = ['P', 'R', 'A', 'E', 'RC'];
    this.chartActasData = {
      labels: orden.map(k => this.estadoLabels[k]),
      datasets: [{
        data: orden.map(k => conteo[k] ?? 0),
        backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'],
        borderWidth: 1,
        hoverOffset: 8
      }]
    };

    // === Gráfica: Beneficiarios por rango de edad ===
    const edades = data.beneficiariosNucleo.map(b => b.edad ?? 0);
    this.chartBenefData = {
      labels: ['0-12', '13-17', '18-29', '30-59', '60+'],
      datasets: [{
        label: 'Beneficiarios',
        data: this.bucketEdades(edades),
        backgroundColor: '#3b82f6'
      }]
    };

    this.loading = false;
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

  async exportarPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // 1️⃣ Capturamos solo la cabecera y los KPIs
    const headerElement = document.querySelector('.kpi-container') as HTMLElement; // Ajusta el selector a tu bloque de KPIs
    const chartsContainer = document.querySelector('.charts-container') as HTMLElement;

    if (!headerElement || !chartsContainer) return;

    // Esperar a que todo se renderice (etiquetas, animaciones)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Capturar el header + KPIs con html2canvas
    const headerCanvas = await html2canvas(headerElement, { scale: 2, useCORS: true });
    const headerImg = headerCanvas.toDataURL('image/png');
    const headerHeight = (headerCanvas.height * 180) / headerCanvas.width;

    // 2️⃣ Capturamos los dos gráficos directamente desde sus canvas
    const chart1 = this.chartActas.nativeElement;
    const chart2 = this.chartBenef.nativeElement;
    const img1 = chart1.toDataURL('image/png');
    const img2 = chart2.toDataURL('image/png');

    // 3️⃣ Agregamos al PDF
    pdf.setFontSize(16);
    pdf.text('Núcleo Familiar', 10, 10);

    // KPIs
    pdf.addImage(headerImg, 'PNG', 10, 15, 190, headerHeight);

    // Gráfico 1
    pdf.addImage(img1, 'PNG', 10, headerHeight + 25, 90, 90);
    // Gráfico 2
    pdf.addImage(img2, 'PNG', 110, headerHeight + 25, 90, 90);

    // 4️⃣ Guardar
    pdf.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    }

  volver(): void {
    this.router.navigate(["nucleo"]);
  }

}