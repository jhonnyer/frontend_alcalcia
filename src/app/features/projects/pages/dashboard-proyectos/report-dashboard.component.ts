import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';

import { ReportesService, ReporteFiltroRequest } from '../../../../core/services/reportes.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Subject, finalize, takeUntil, timeout } from 'rxjs';
import { dashboardLoadError } from '../../../../shared/components/dashboard-charts/dashboard-load.utils';
import { DashboardReport, ResumenProyecto } from '../../../../core/models/reporte-global/reportes.model';
import { dashboardYears, hasDashboardData } from '../../../../core/models/reporte-global/dashboard.utils';
import { DashboardChartsComponent } from '../../../../shared/components/dashboard-charts/dashboard-charts.component';
import { Router } from '@angular/router';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ReportesPdfService } from '../../../../core/services/reportes-pdf.service';
import { pdfErrorMessage } from '../../../../shared/components/pdf/pdf-export.utils';

type ProjectDetailSection = 'categorias' | 'productos' | 'actas' | 'beneficiarios';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatExpansionModule, MatTabsModule,
    DashboardChartsComponent
  ],
  templateUrl: './report-dashboard.component.html',
  styleUrl: './report-dashboard.component.scss'
})
export class ReportDashboardComponent implements OnInit {
  private reportes = inject(ReportesService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  private pdfService = inject(ReportesPdfService);
  private alert = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  readonly hasDashboardData = hasDashboardData;
  loadError = signal('');
  loadingDashboard = signal(false);
  filterError = signal('');
  private readonly cancelLoad = new Subject<void>();

  @HostListener('window:offline')
  onOffline(): void {
    const loading = this.loadingDashboard();
    const filtering = this.aplicandoFiltros();
    this.cancelLoad.next();
    if (loading) this.loadError.set('Se perdió la conexión. Puedes seguir navegando; reintenta cuando tengas señal.');
    if (filtering) this.filterError.set('Se perdió la conexión. Se conserva la última consulta aplicada. Reintenta cuando tengas señal.');
  }

  @HostListener('window:online')
  onOnline(): void {
    if (this.loadError()) this.loadDashboard();
    else if (this.filterError()) this.aplicarFiltros();
  }

  // Dashboard sin filtrar (para opciones de filtro y para restaurar)
  baseDashboard = signal<DashboardReport | null>(null);
  // Selección pendiente de aplicar; filtroAnio/filtroMes guardan lo ya aplicado
  selProyecto = signal<'ALL' | number>('ALL');
  selAnio = signal<'ALL' | number>('ALL');
  selMes = signal<'ALL' | number>('ALL');
  private proyectoAplicado = signal<'ALL' | number>('ALL');
  aplicandoFiltros = signal(false);
  detailSectionByProject = signal<Record<number, ProjectDetailSection>>({});
  beneficiaryPageIndexByProject = signal<Record<number, number>>({});
  beneficiaryPageSize = signal(5);
  readonly beneficiaryPageSizeOptions = [5, 10, 20, 50];

  proyectosOpciones = computed(() =>
    (this.baseDashboard()?.proyectosResumen ?? [])
      .map(p => ({ id: p.idProyecto, nombre: p.nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre)));

  hayFiltrosAplicados = computed(() =>
    this.proyectoAplicado() !== 'ALL' || this.filtroAnio() !== 'ALL' || this.filtroMes() !== 'ALL');

  filtrosPendientes = computed(() =>
    this.selProyecto() !== this.proyectoAplicado() || this.selAnio() !== this.filtroAnio()
    || this.selMes() !== this.filtroMes());

  etiquetaFiltro = computed(() => {
    const partes: string[] = [];
    const idProyecto = this.proyectoAplicado();
    if (idProyecto !== 'ALL') {
      const nombre = this.proyectosOpciones().find(p => p.id === idProyecto)?.nombre;
      partes.push(`Proyecto: ${nombre ?? idProyecto}`);
    }
    const mes = this.filtroMes();
    if (mes !== 'ALL') partes.push(this.mesesDisponibles.find(m => m.numero === mes)?.nombre ?? String(mes));
    const anio = this.filtroAnio();
    if (anio !== 'ALL') partes.push(String(anio));
    return partes.join(' · ');
  });

  // Payload cacheado
  dashboard = signal<DashboardReport | null>(null);
  productFiltersByProject = signal<Record<number, string>>({});
  productFiltersByCategory = signal<Record<number, string>>({});
  beneficiaryFiltersByProject = signal<Record<number, string>>({});
  collapsedBeneficiariosByProject = signal<Record<number, boolean>>({});

  // Filtros
  filtroTexto = signal<string>('');
  filtroEstado = signal<'ALL'|'A'|'I'>('ALL');
  filtroCategoria = signal<string>('ALL');
  filtroProyectoLista = signal<'ALL' | number>('ALL');
  filtroFechaInicio = signal<string | null>(null); // YYYY-MM-DD
  filtroFechaFin = signal<string | null>(null);    // YYYY-MM-DD
  aniosDisponibles: number[] = [];
  filtroAnio = signal<'ALL' | number>('ALL');
  filtroMes = signal<'ALL' | number>('ALL');
  projectPageIndex = signal(0);
  projectPageSize = signal(6);
  readonly projectPageSizeOptions = [6, 10, 15];
  showProjectList = signal(true);
  projectPaginationEnabled = signal(true);
  selectedProjectId = signal<number | null>(null);

  mesesDisponibles = [
    { nombre: 'Enero', numero: 1 },
    { nombre: 'Febrero', numero: 2 },
    { nombre: 'Marzo', numero: 3 },
    { nombre: 'Abril', numero: 4 },
    { nombre: 'Mayo', numero: 5 },
    { nombre: 'Junio', numero: 6 },
    { nombre: 'Julio', numero: 7 },
    { nombre: 'Agosto', numero: 8 },
    { nombre: 'Septiembre', numero: 9 },
    { nombre: 'Octubre', numero: 10 },
    { nombre: 'Noviembre', numero: 11 },
    { nombre: 'Diciembre', numero: 12 }
  ];

  private readonly MAX_VISIBLES = 8;

  // === Paginación por categoría ===
  readonly pageSize = 8;
  pageIndexByCat = signal<Record<number, number>>({});

  categoriasDisponibles: string[] = [];
  categoriasDisponiblesFiltradas = computed<string[]>(() => {
    const dashboard = this.dashboard();
    if (!dashboard) return [];

    const selectedProject = this.filtroProyectoLista();
    if (selectedProject !== 'ALL') {
      const project = (dashboard.proyectosResumen ?? []).find(item => item.idProyecto === selectedProject);
      const categories = new Set<string>();
      (project?.categorias ?? []).forEach(category => {
        if (category.nombreCategoria) categories.add(category.nombreCategoria);
      });
      return Array.from(categories).sort((a, b) => a.localeCompare(b));
    }

    return [...this.categoriasDisponibles];
  });
  isLoadingPDF = false;

    ngOnInit(): void {
        this.pageTitleService.setCurrentPage('Dashboard Proyectos');
        this.loadDashboard();
    }

    loadDashboard(): void {
        if (this.loadingDashboard() || this.aplicandoFiltros()) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.loadError.set('No hay conexión a internet. Puedes seguir navegando; las estadísticas se reintentarán cuando vuelva la conexión.');
          return;
        }
        this.loadingDashboard.set(true);
        this.loadError.set('');
        this.reportes.obtenerDashboard().pipe(
          timeout(15000), takeUntil(this.cancelLoad), takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loadingDashboard.set(false))
        ).subscribe({
          next: d => {
            this.baseDashboard.set(d);
            this.dashboard.set(d);
            // categorías únicas para filtro
            const setCats = new Set<string>();
            (d.proyectosResumen ?? []).forEach(p =>
                (p.categorias ?? []).forEach(c => c.nombreCategoria && setCats.add(c.nombreCategoria))
            );
            this.categoriasDisponibles = Array.from(setCats).sort((a,b)=>a.localeCompare(b));

            this.aniosDisponibles = dashboardYears(d);
          },
          error: error => {
            console.error('Error al cargar el dashboard de proyectos:', error);
            this.loadError.set(dashboardLoadError(error));
          }
        });
    }

    private yearToRange(year: number) {
        const start = Date.parse(`${year}-01-01`);
        const end   = Date.parse(`${year}-12-31`);
        return { start, end };
    }

  // ========= Proyectos filtrados =========
  proyectosFiltrados = computed<ResumenProyecto[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    let list = [...(d.proyectosResumen ?? [])];

    const selectedProject = this.filtroProyectoLista();
    if (selectedProject !== 'ALL') {
      list = list.filter(project => project.idProyecto === selectedProject);
    }

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

  totalProjectPages = computed(() => {
    if (!this.projectPaginationEnabled()) return 1;
    return Math.max(1, Math.ceil(this.proyectosFiltrados().length / this.projectPageSize()));
  });

  currentProjectPage = computed(() =>
    Math.min(this.projectPageIndex(), this.totalProjectPages() - 1)
  );

  proyectosPaginados = computed<ResumenProyecto[]>(() => {
    if (!this.projectPaginationEnabled()) return this.proyectosFiltrados();
    const size = this.projectPageSize();
    const index = this.currentProjectPage();
    const start = index * size;
    return this.proyectosFiltrados().slice(start, start + size);
  });

  selectedProject = computed<ResumenProyecto | null>(() => {
    const pageProjects = this.proyectosPaginados();
    if (!pageProjects.length) return null;
    const selected = pageProjects.find(project => project.idProyecto === this.selectedProjectId());
    return selected ?? pageProjects[0];
  });

  pageStartProject = computed(() => {
    const total = this.proyectosFiltrados().length;
    if (!total) return 0;
    if (!this.projectPaginationEnabled()) return 1;
    return this.currentProjectPage() * this.projectPageSize() + 1;
  });

  pageEndProject = computed(() => {
    const total = this.proyectosFiltrados().length;
    if (!this.projectPaginationEnabled()) return total;
    return Math.min(total, this.pageStartProject() + this.projectPageSize() - 1);
  });

  trackByProyecto = (_: number, p: ResumenProyecto) => p.idProyecto;
  
  onFiltroProyectoListaChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const parsedValue: 'ALL' | number = value === 'ALL' ? 'ALL' : Number(value);
    this.filtroProyectoLista.set(parsedValue);

    const currentCategory = this.filtroCategoria();
    if (currentCategory !== 'ALL' && !this.categoriasDisponiblesFiltradas().includes(currentCategory)) {
      this.filtroCategoria.set('ALL');
    }

    this.projectPageIndex.set(0);
    this.selectedProjectId.set(null);
  }

  clearProjectListFilters(): void {
    this.filtroTexto.set('');
    this.filtroProyectoLista.set('ALL');
    this.filtroEstado.set('ALL');
    this.filtroCategoria.set('ALL');
    this.projectPageIndex.set(0);
    this.selectedProjectId.set(null);
  }

  categoriasFiltradasProyecto(p: ResumenProyecto) {
    const categorias = p.categorias ?? [];
    const categoriaSeleccionada = this.filtroCategoria();
    if (categoriaSeleccionada === 'ALL') return categorias;
    return categorias.filter(categoria => categoria.nombreCategoria === categoriaSeleccionada);
  }
  trackByCategoria = (_: number, c: any) => c?.idCategoria ?? _;

  onProjectPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.projectPageSize.set(Number.isFinite(value) && value > 0 ? value : 6);
    this.projectPageIndex.set(0);
    this.selectedProjectId.set(null);
  }

  toggleProjectList(): void {
    this.showProjectList.update(value => !value);
  }

  toggleProjectPagination(): void {
    this.projectPaginationEnabled.update(value => !value);
    this.projectPageIndex.set(0);
    this.selectedProjectId.set(null);
  }

  previousProjectPage(): void {
    if (!this.projectPaginationEnabled()) return;
    this.projectPageIndex.update(page => Math.max(0, page - 1));
    this.selectedProjectId.set(null);
  }

  nextProjectPage(): void {
    if (!this.projectPaginationEnabled()) return;
    this.projectPageIndex.update(page => Math.min(this.totalProjectPages() - 1, page + 1));
    this.selectedProjectId.set(null);
  }

  selectProject(projectId: number): void {
    this.selectedProjectId.set(projectId);
  }

  // ========= Filtros del reporte (se aplican en el backend) =========
  onSelAnio(anio: 'ALL' | number) {
    this.selAnio.set(anio);
    if (anio === 'ALL') this.selMes.set('ALL');
  }

  private valorSel(event: Event): 'ALL' | number {
    const v = (event.target as HTMLSelectElement).value;
    return v === 'ALL' ? 'ALL' : Number(v);
  }

  onSelProyecto(event: Event) { this.selProyecto.set(this.valorSel(event)); }
  onSelAnioEvt(event: Event) { this.onSelAnio(this.valorSel(event)); }
  onSelMesEvt(event: Event) { this.selMes.set(this.valorSel(event)); }

  aplicarFiltros() {
    if (this.aplicandoFiltros() || this.loadingDashboard()) return;
    const proyecto = this.selProyecto();
    const anio = this.selAnio();
    const mes = this.selMes();

    if (proyecto === 'ALL' && anio === 'ALL' && mes === 'ALL') {
      this.limpiarFiltros();
      return;
    }
    if (mes !== 'ALL' && anio === 'ALL') {
      this.alert.warning('Selecciona un año', 'Para filtrar por mes debes elegir también el año.');
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.filterError.set('No hay conexión. Se conserva la última consulta aplicada. Reintenta cuando tengas señal.');
      return;
    }

    const filtro: ReporteFiltroRequest = {
      idProyecto: proyecto === 'ALL' ? undefined : proyecto,
      incluirActoresSinFecha: true,
    };
    if (anio !== 'ALL') {
      const m = mes === 'ALL' ? null : mes;
      const mm = String(m ?? 1).padStart(2, '0');
      const ultimoDia = m ? new Date(anio, m, 0).getDate() : 31;
      filtro.fechaInicio = `${anio}-${mm}-01`;
      filtro.fechaFin = `${anio}-${m ? mm : '12'}-${String(ultimoDia).padStart(2, '0')}`;
    }

    this.aplicandoFiltros.set(true);
    this.filterError.set('');
    this.reportes.obtenerDashboardFiltrado(filtro).pipe(
      timeout(15000),
      takeUntil(this.cancelLoad),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.aplicandoFiltros.set(false))
    ).subscribe({
      next: d => {
        this.proyectoAplicado.set(proyecto);
        this.filtroAnio.set(anio);
        this.filtroMes.set(mes);
        this.dashboard.set(d);
      },
      error: error => {
        console.error('Error al aplicar filtros del reporte:', error);
        this.filterError.set(`${dashboardLoadError(error)} Se conserva la última consulta aplicada.`);
      },
    });
  }

  limpiarFiltros() {
    if (this.aplicandoFiltros()) return;
    this.filterError.set('');
    this.selProyecto.set('ALL');
    this.selAnio.set('ALL');
    this.selMes.set('ALL');
    this.proyectoAplicado.set('ALL');
    this.filtroAnio.set('ALL');
    this.filtroMes.set('ALL');
    const base = this.baseDashboard();
    if (base) {
      this.dashboard.set(base);
    }
  }

  // ========= Presentación de proyectos =========
  progreso(p: ResumenProyecto): number {
    const ini = p.fechaInicio ? Date.parse(p.fechaInicio) : NaN;
    const fin = p.fechaFin ? Date.parse(p.fechaFin) : NaN;
    if (Number.isNaN(ini) || Number.isNaN(fin) || fin <= ini) return 0;
    return Math.max(0, Math.min(100, Math.round(((Date.now() - ini) / (fin - ini)) * 100)));
  }

  getBeneficiaryFilter(projectId: number): string {
    return this.beneficiaryFiltersByProject()[projectId] ?? '';
  }

  getProjectDetailSection(projectId: number): ProjectDetailSection {
    return this.detailSectionByProject()[projectId] ?? 'categorias';
  }

  setProjectDetailSection(projectId: number, section: ProjectDetailSection): void {
    this.detailSectionByProject.update(state => ({ ...state, [projectId]: section }));
  }

  setBeneficiaryFilter(projectId: number, text: string): void {
    const query = (text ?? '').toString();
    this.beneficiaryFiltersByProject.update(state => ({ ...state, [projectId]: query }));
    this.beneficiaryPageIndexByProject.update(state => ({ ...state, [projectId]: 0 }));
  }

  clearBeneficiaryFilter(projectId: number): void {
    this.setBeneficiaryFilter(projectId, '');
  }

  isBeneficiariosCollapsed(projectId: number): boolean {
    return this.collapsedBeneficiariosByProject()[projectId] ?? false;
  }

  toggleBeneficiarios(projectId: number): void {
    this.collapsedBeneficiariosByProject.update(state => ({
      ...state,
      [projectId]: !(state[projectId] ?? false)
    }));
  }

  filteredBeneficiarios(p: ResumenProyecto) {
    const list = p.beneficiarios ?? [];
    const query = this.getBeneficiaryFilter(p.idProyecto).trim().toLowerCase();
    if (!query) return list;

    return list.filter(beneficiario =>
      `${beneficiario.nombreCompleto ?? ''} ${beneficiario.tipoDocumento ?? ''} ${beneficiario.documento ?? ''} ${beneficiario.barrio ?? ''} ${beneficiario.nombreNucleo ?? ''}`
        .toLowerCase()
        .includes(query)
    );
  }

  getBeneficiaryPageIndex(projectId: number): number {
    return this.beneficiaryPageIndexByProject()[projectId] ?? 0;
  }

  getBeneficiaryTotalPages(p: ResumenProyecto): number {
    const total = this.filteredBeneficiarios(p).length;
    return Math.max(1, Math.ceil(total / this.beneficiaryPageSize()));
  }

  getBeneficiaryPageStart(p: ResumenProyecto): number {
    const total = this.filteredBeneficiarios(p).length;
    if (!total) return 0;
    return this.getBeneficiaryPageIndex(p.idProyecto) * this.beneficiaryPageSize() + 1;
  }

  getBeneficiaryPageEnd(p: ResumenProyecto): number {
    return Math.min(
      this.filteredBeneficiarios(p).length,
      this.getBeneficiaryPageStart(p) + this.beneficiaryPageSize() - 1
    );
  }

  onBeneficiaryPageSizeChange(event: Event, projectId: number): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.beneficiaryPageSize.set(Number.isFinite(value) && value > 0 ? value : 5);
    this.beneficiaryPageIndexByProject.update(state => ({ ...state, [projectId]: 0 }));
  }

  previousBeneficiaryPage(projectId: number): void {
    const current = this.getBeneficiaryPageIndex(projectId);
    this.beneficiaryPageIndexByProject.update(state => ({ ...state, [projectId]: Math.max(0, current - 1) }));
  }

  nextBeneficiaryPage(p: ResumenProyecto): void {
    const current = this.getBeneficiaryPageIndex(p.idProyecto);
    const last = this.getBeneficiaryTotalPages(p) - 1;
    this.beneficiaryPageIndexByProject.update(state => ({ ...state, [p.idProyecto]: Math.min(last, current + 1) }));
  }

  beneficiariosVisibles(p: ResumenProyecto) {
    const lista = this.filteredBeneficiarios(p);
    const pageIndex = this.getBeneficiaryPageIndex(p.idProyecto);
    const pageSize = this.beneficiaryPageSize();
    const start = pageIndex * pageSize;
    return lista.slice(start, start + pageSize);
  }

  // ========= Exportar PDF =========
  async exportarPDF() {
    if (this.isLoadingPDF) return;
    const d = this.dashboard();
    if (!d) return;
    this.isLoadingPDF = true;
    try {
      const anio = this.filtroAnio();
      const mes = this.filtroMes();
      const filtro: ReporteFiltroRequest = {
        idProyecto: this.proyectoAplicado() === 'ALL' ? undefined : Number(this.proyectoAplicado()),
        incluirActoresSinFecha: true,
      };
      if (anio !== 'ALL') {
        const mm = String(mes === 'ALL' ? 1 : mes).padStart(2, '0');
        const ultimoDia = mes === 'ALL' ? 31 : new Date(anio, mes, 0).getDate();
        filtro.fechaInicio = `${anio}-${mm}-01`;
        filtro.fechaFin = `${anio}-${mes === 'ALL' ? '12' : mm}-${String(ultimoDia).padStart(2, '0')}`;
      }
      await this.pdfService.dashboard(filtro);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.alert.error('No se pudo exportar el PDF', pdfErrorMessage(error));
    } finally {
      this.isLoadingPDF = false;
    }
  }

  // ======= Productos: chips con “ver más” =======
  expandedCats = signal<Record<number, boolean>>({});
  collapsedCategories = signal<Record<string, boolean>>({});

  private categoryKey(projectId: number, categoryId: number): string {
    return `${projectId}-${categoryId}`;
  }

  isCategoryCollapsed(projectId: number, categoryId: number): boolean {
    const key = this.categoryKey(projectId, categoryId);
    return this.collapsedCategories()[key] ?? true;
  }

  toggleCategory(projectId: number, categoryId: number): void {
    const key = this.categoryKey(projectId, categoryId);
    this.collapsedCategories.update(state => ({
      ...state,
      [key]: !(state[key] ?? true)
    }));
  }

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
}
