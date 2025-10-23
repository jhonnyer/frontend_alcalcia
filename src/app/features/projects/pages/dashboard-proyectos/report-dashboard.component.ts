import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';

import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartType, ChartData, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ReportesService } from '../../../../core/services/reportes.service';
import { DashboardReport, ResumenProyecto } from '../../../../core/models/reporte-global/reportes.model';
import { Router } from '@angular/router';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { PdfGeneradorDashboardService } from '../../../../shared/components/pdf/pdf-generador-dashboard.service';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatExpansionModule,
    BaseChartDirective
  ],
  templateUrl: './report-dashboard.component.html',
  styleUrl: './report-dashboard.component.scss'
})
export class ReportDashboardComponent implements OnInit {
  private reportes = inject(ReportesService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  private pdfService = inject(PdfGeneradorDashboardService);

  // Payload cacheado
  dashboard = signal<DashboardReport | null>(null);
  productFiltersByProject = signal<Record<number, string>>({});
  productFiltersByCategory = signal<Record<number, string>>({});

  // Filtros
  filtroTexto = signal<string>('');
  filtroEstado = signal<'ALL'|'A'|'I'>('ALL');
  filtroCategoria = signal<string>('ALL');
  filtroFechaInicio = signal<string | null>(null); // YYYY-MM-DD
  filtroFechaFin = signal<string | null>(null);    // YYYY-MM-DD
  aniosDisponibles: number[] = [];
  filtroAnio = signal<'ALL' | number>('ALL');

  // Nuevo doughnut para edades
  chartEdadType: 'doughnut' = 'doughnut'; 
  chartEdadData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  chartEdadOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '55%',
    plugins: {
        legend: {
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: { filter: (ctx) => Number(ctx.raw) > 0 },
        datalabels: {
        display: (ctx) => (ctx.dataset.data[ctx.dataIndex] as number) > 0,
        formatter: (value: number, ctx: any) => {
            const data = ctx.chart.data.datasets?.[0].data as number[];
            const total = data.reduce((a,b)=>a+(Number(b)||0),0);
            if (!total) return '';
            return `${Math.round((Number(value)/total)*100)}%`;
        },
        color: '#fff',
        font: { weight: 'bold', size: 12 }
        }
    }
  };

  private readonly MAX_VISIBLES = 8;

  // === Paginación por categoría ===
  readonly pageSize = 8;
  pageIndexByCat = signal<Record<number, number>>({});

  categoriasDisponibles: string[] = [];
  isLoadingPDF = false;

  // ========= Gráficas =========
  // Pie: Población vulnerable
  chartPVType: ChartType = 'pie';
  chartPVData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartPVOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold' },
        formatter: (value: number, ctx: any) => {
          const t = (ctx.chart.data.datasets?.[0].data as number[]).reduce((a,b)=>a+b,0);
          return t ? `${((value/t)*100).toFixed(1)}%` : '0%';
        }
      }
    }
  };

  // Barras: Actas por mes/estado
  chartActasType: ChartType = 'bar';
  chartActasData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartActasOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  // Barras horizontales: Top productos
  chartProdType: ChartType = 'bar';
  chartProdData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartProdOptions: ChartConfiguration['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  };

  // Definición de buckets y sus rangos
    EDAD_BUCKETS = [
    'Primera infancia', // 0–5
    'Infancia',         // 6–12
    'Adolescencia',     // 13–17
    'Joven',            // 18–28
    'Adulto',           // 29–59
    'Adulto mayor'      // 60+
    ] as const;

    EDAD_RANGOS: Record<string, string> = {
    'Primera infancia': '0–5',
    'Infancia': '6–12',
    'Adolescencia': '13–17',
    'Joven': '18–28',
    'Adulto': '29–59',
    'Adulto mayor': '60+'
    };

    public readonly EDAD_COLORS = [
    '#60a5fa', 
    '#75ee50ff', 
    '#278ac4ff', 
    '#150abbff', 
    '#e08712ff', 
    '#f13131ff'
    ];

    ngOnInit(): void {
        this.pageTitleService.setCurrentPage('Dashboard Proyectos');
        this.reportes.obtenerDashboard().subscribe(d => {
            this.dashboard.set(d);
            // categorías únicas para filtro
            const setCats = new Set<string>();
            (d.proyectosResumen ?? []).forEach(p =>
                (p.categorias ?? []).forEach(c => c.nombreCategoria && setCats.add(c.nombreCategoria))
            );
            this.categoriasDisponibles = Array.from(setCats).sort((a,b)=>a.localeCompare(b));

            // años únicos tomados de fechas de proyectos
            const years = new Set<number>();
            for (const p of d.proyectosResumen ?? []) {
                if (p.fechaInicio) years.add(new Date(p.fechaInicio).getFullYear());
                if (p.fechaFin)    years.add(new Date(p.fechaFin).getFullYear());
            }
            this.aniosDisponibles = Array.from(years).sort((a,b)=>a-b);

            this.buildCharts(d);
        });
    }

    private yearToRange(year: number) {
        const start = Date.parse(`${year}-01-01`);
        const end   = Date.parse(`${year}-12-31`);
        return { start, end };
    }
    

  private buildCharts(d: DashboardReport) {
    // Pie Población vulnerable
    const pv = d.poblacionVulnerable;
    if (pv) {
      const labels = ['Discapacidad','Víctimas','Menores','Mujeres','LGBTI'];
      const data = [
        pv.discapacidad ?? 0,
        pv.victimas ?? 0,
        // el backend envía "menoresEdad"
        (pv as any).menoresEdad ?? 0,
        pv.mujeres ?? 0,
        pv.lgbti ?? 0
      ];
      this.chartPVData = { labels, datasets: [{ data, backgroundColor: ['#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444'] }] };
    }

    // Barras Actas por mes (agrupadas por estado)
    const porMes = d.actasPorMes ?? [];
    const labelsMes = Array.from(new Set(porMes.map(x => `${x.anio}-${String(x.mes).padStart(2,'0')}`))).sort();
    const estados = Array.from(new Set(porMes.map(x => x.estado))).sort();
    const datasets = estados.map(est => {
      const datos = labelsMes.map(l => {
        const it = porMes.find(x => `${x.anio}-${String(x.mes).padStart(2,'0')}` === l && x.estado === est);
        return it?.total ?? 0;
      });
      return { label: est, data: datos } as any;
    });
    this.chartActasData = { labels: labelsMes, datasets };

    // Top productos entregados (top 10)
    const prods = (d.productosEntregados ?? []).slice()
      .sort((a,b)=> b.totalEntregado - a.totalEntregado)
      .slice(0, 10);
    this.chartProdData = {
      labels: prods.map(p => p.producto),
      datasets: [{ label: 'Entregados', data: prods.map(p => p.totalEntregado), backgroundColor: '#e7da8eff' }]
    };

    // Distribución por edad (mantener todos los buckets)
    const de = d.distribucionEdad ?? [];
    const mapEdad = new Map<string, number>();
    for (const it of de) mapEdad.set(it.rangoEdad, Number(it.total) || 0);

    const edadLabels = this.EDAD_BUCKETS.map(b => `${b} (${this.EDAD_RANGOS[b]})`);
    const edadData   = this.EDAD_BUCKETS.map(b => mapEdad.get(b) ?? 0);

    this.chartEdadData = {
        labels: edadLabels,
        datasets: [{ data: edadData, backgroundColor: this.EDAD_COLORS }]
    };
  }

  // ========= Proyectos filtrados =========
  proyectosFiltrados = computed<ResumenProyecto[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    let list = [...(d.proyectosResumen ?? [])];

    const txt = this.filtroTexto().trim().toLowerCase();
    if (txt) {
      list = list.filter(p =>
        (p.nombre?.toLowerCase().includes(txt)) ||
        (p.descripcion?.toLowerCase().includes(txt))
      );
    }

    const est = this.filtroEstado();
    if (est !== 'ALL') list = list.filter(p => p.estado === est);

    const cat = this.filtroCategoria();
    if (cat !== 'ALL') list = list.filter(p => (p.categorias ?? []).some(c => c.nombreCategoria === cat));

    // Fechas con parse seguro
    const parse = (s?: string | null) => (s ? new Date(s).getTime() : Number.NEGATIVE_INFINITY);
    const parseEnd = (s?: string | null) => (s ? new Date(s).getTime() : Number.POSITIVE_INFINITY);
    const fi = this.filtroFechaInicio();
    const ff = this.filtroFechaFin();
    if (fi) list = list.filter(p => parse(p.fechaInicio) >= parse(fi));
    if (ff) list = list.filter(p => parseEnd(p.fechaFin) <= parseEnd(ff));

    const selYear = this.filtroAnio();
    if (selYear !== 'ALL') {
    const { start: yStart, end: yEnd } = this.yearToRange(selYear);

    const toTs = (s?: string | null): number | null => {
        if (!s) return null;
        const t = Date.parse(s);
        return Number.isNaN(t) ? null : t;
    };

    list = list.filter(p => {
        const si = toTs(p.fechaInicio);
        const sf = toTs(p.fechaFin);
        if (si === null && sf === null) return false;
        const start = (si ?? sf)!;
        const end   = (sf ?? si)!;
        // solapa con el año seleccionado
        if (end   < yStart) return false;
        if (start > yEnd)   return false;
        return true;
        });
    }


    return list.sort((a,b)=>a.nombre.localeCompare(b.nombre));
  });

  trackByProyecto = (_: number, p: ResumenProyecto) => p.idProyecto;
  trackByCategoria = (_: number, c: any) => c?.idCategoria ?? _;

  // ========= Exportar PDF =========
  exportarPDF() {
    const d = this.dashboard();
    if (!d) return;
    this.isLoadingPDF = true;
    setTimeout(() => {
      this.pdfService.generateDashboardReport(d);
      this.isLoadingPDF = false;
    }, 200);
  }

  // ======= Productos: chips con “ver más” =======
  expandedCats = signal<Record<number, boolean>>({});

  toggleCat(idCat: number) {
    this.expandedCats.update(s => ({ ...s, [idCat]: !s[idCat] }));
  }

  isExpanded(idCat: number): boolean {
    return !!this.expandedCats()[idCat];
  }

    // Productos visibles (aplica filtro y “ver más”)
    visibleProductos(categoria: any) {
        const filtered = this.filterProductosByCategory(categoria);
        if (this.isExpanded(categoria?.idCategoria)) return filtered;
        return filtered.slice(0, this.MAX_VISIBLES);
    }

    // Cuántos quedan ocultos (considerando filtro)
    hiddenCount(categoria: any): number {
        const total = this.filterProductosByCategory(categoria).length;
        return Math.max(0, total - this.MAX_VISIBLES);
    }
 
    private filterProductosByCategory(categoria: any) {
        const items = categoria?.productos ?? [];
        const q = this.getCategoryFilter(categoria?.idCategoria).trim().toLowerCase();
        if (!q) return items;
        return items.filter((p: any) =>
            (p?.nombreProducto ?? '').toLowerCase().includes(q)
        );
    }

  // total a mostrar en el badge (evita el warning del ?? en template)
    getTotalProductos(c: any): number {
    return (c?.totalProductos !== undefined && c?.totalProductos !== null)
        ? c.totalProductos
        : (c?.productos?.length ?? 0);
    }

    currentPage(catId: number): number {
        return this.pageIndexByCat()[catId] ?? 0;
    }

    setPage(catId: number, page: number) {
        this.pageIndexByCat.update(s => ({ ...s, [catId]: Math.max(0, page) }));
    }

    totalPages(c: any): number {
        const total = c?.productos?.length ?? 0;
        return Math.max(1, Math.ceil(total / this.pageSize));
    }

    nextPage(c: any) {
        const id = c?.idCategoria;
        const p = this.currentPage(id);
        const last = this.totalPages(c) - 1;
        if (p < last) this.setPage(id, p + 1);
    }

    prevPage(c: any) {
        const id = c?.idCategoria;
        const p = this.currentPage(id);
        if (p > 0) this.setPage(id, p - 1);
    }

    getProjectFilter(projectId: number): string {
      return this.productFiltersByProject()[projectId] ?? '';
    }

    setProjectFilter(projectId: number, text: string) {
        const t = (text ?? '').toString();
        this.productFiltersByProject.update(state => ({ ...state, [projectId]: t }));
    }

    // Lista filtrada por texto del proyecto
    private filterProductosByProject(categoria: any, projectId: number) {
        const items = categoria?.productos ?? [];
        const q = this.getProjectFilter(projectId).trim().toLowerCase();
        if (!q) return items;
        return items.filter((p: any) =>
            (p?.nombreProducto ?? '').toLowerCase().includes(q)
        );
    }

    getCategoryFilter(catId: number): string {
        return this.productFiltersByCategory()[catId] ?? '';
    }

    setCategoryFilter(catId: number, text: string) {
        const t = (text ?? '').toString();
        this.productFiltersByCategory.update(state => ({ ...state, [catId]: t }));
    }

  cerrar() {
    this.router.navigate(['/projects']);
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
