import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize, timeout } from 'rxjs';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ActasService, FiltroReporteActas } from '../../../../core/services/actas.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { DashboardExcelReport, ReportesService, ReporteFiltroRequest } from '../../../../core/services/reportes.service';
import { AlertService } from '../../../../core/services/alert.service';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { PdfGeneradorDashboardService } from '../../../../shared/components/pdf/pdf-generador-dashboard.service';
import { pdfErrorMessage } from '../../../../shared/components/pdf/pdf-export.utils';
import { mensajeErrorReporteExcel } from '../../../../shared/components/excel/excel-error.utils';
import { ReportSearchOption, ReportSearchSelectComponent } from '../../../../shared/components/report-search-select/report-search-select.component';
import { DashboardComponent } from '../../../projects/pages/dashboard-general/dashboard.component';

type ReportKeys = DashboardExcelReport | 'productProject' | 'actas';
type PeriodReportKey = Extract<ReportKeys, 'actas' | 'proyectos' | 'productProject' | 'productos' | 'beneficiariosProyecto' | 'reportGeneral'>;
interface PeriodReportOption {
  key: PeriodReportKey;
  label: string;
  proyecto: boolean;
  categoria: boolean;
  solicitud: boolean;
  descripcion: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, HasRoleDirective, CommonModule, FormsModule, MatMenuModule, MatDividerModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTabsModule, DashboardComponent, ReportSearchSelectComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private pageTitleService = inject(PageTitleService);
  private actasService = inject(ActasService);
  private responsibleService = inject(ResponsibleService);
  private reportes = inject(ReportesService);
  private pdfDashboard = inject(PdfGeneradorDashboardService);
  private alert = inject(AlertService);
  private proyectosService = inject(ProyectosService);
  private destroyRef = inject(DestroyRef);

  reportOptionsError = '';
  selectedPeriodReport: PeriodReportKey | null = 'actas';
  excelProjectId: number | null = null;
  excelCategoryId: number | null = null;
  excelTipoSolicitud = '';
  excelProjectValid = true;
  excelCategoryValid = true;
  excelResetKey = 0;
  excelCategoryResetKey = 0;
  pdfProjectValid = true;
  pdfCategoryValid = true;
  pdfResponsibleValid = true;
  pdfResetKey = 0;
  pdfCategoryResetKey = 0;
  readonly periodReportOptions: PeriodReportOption[] = [
    { key: 'actas', label: 'Actas', proyecto: true, categoria: true, solicitud: true,
      descripcion: 'Fecha de creación del acta. Categorías de productos y paquetes. Tipo de solicitud busca por parte del texto.' },
    { key: 'proyectos', label: 'Proyectos', proyecto: true, categoria: true, solicitud: false,
      descripcion: 'Proyectos vigentes durante el período. La categoría filtra proyectos que la tienen asociada.' },
    { key: 'productProject', label: 'Productos por Proyecto', proyecto: true, categoria: true, solicitud: false,
      descripcion: 'Proyectos vigentes y productos ingresados en el período. Relación proyecto–categoría–producto.' },
    { key: 'productos', label: 'Productos', proyecto: true, categoria: true, solicitud: false,
      descripcion: 'Fecha de ingreso del producto. Proyecto y categoría según su asociación en inventario.' },
    { key: 'beneficiariosProyecto', label: 'Beneficiarios por Proyecto', proyecto: true, categoria: false, solicitud: false,
      descripcion: 'Vigencia de la vinculación al proyecto. No aplica categoría ni tipo de solicitud.' },
    { key: 'reportGeneral', label: 'Reporte Global (mixto)', proyecto: false, categoria: false, solicitud: false,
      descripcion: 'Ocho hojas con distintas fechas operativas. Solo aplica período. Actores sociales completos sin filtro temporal.' }
  ];
  readonly reportSearchOptions = this.periodReportOptions.map(option => ({ value: option.key, label: option.label }));
  get periodReportOption(): PeriodReportOption | undefined {
    return this.periodReportOptions.find(option => option.key === this.selectedPeriodReport);
  }
  get downloadingPeriodReport(): boolean {
    return this.periodReportOptions.some(option => this.isLoadingReport[option.key]);
  }

  isLoadingPDF = false;
  reportPeriod: 'ALL' | 'YEAR' | 'MONTH' = 'ALL';
  reportYear = new Date().getFullYear();
  reportMonth = new Date().getMonth() + 1;
  reportEstadosActa: string[] = [];
  reportPrioridades: string[] = [];
  reportProjectId: number | null = null;
  reportCategoryId: number | null = null;
  reportResponsibleId: number | null = null;
  reportProjectOptions: Array<{ id: number; nombre: string }> = [];
  reportCategoryOptions: Array<{ id: number; nombre: string; projectId: number }> = [];
  reportResponsibleOptions: Array<{ id: number; nombre: string }> = [];
  reportGeneralOpen = false;
  reportPeriodOpen = false;
  reportGeneralReportsOpen = false;
  readonly reportYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  readonly reportMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre',
    'Octubre', 'Noviembre', 'Diciembre'].map((label, i) => ({ value: i + 1, label }));
  isLoadingReport: Record<ReportKeys, boolean> = {
    productProject: false, beneficiarios: false, categorias: false, responsables: false, nucleos: false,
    actas: false, productos: false, proyectos: false, beneficiariosProyecto: false, reportGeneral: false
  };

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('SISTEMA INTEGRAL DE PROYECTOS Y DONACIONES MUNICIPALES');
    this.loadReportFilterOptions();
  }

  private loadReportFilterOptions(): void {
    this.proyectosService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        const projects = response.respuesta ?? [];
        this.reportProjectOptions = projects.map(item => ({ id: item.proyecto.idProyecto, nombre: item.proyecto.nombre }));
        this.reportCategoryOptions = projects.flatMap(item => (item.categorias ?? []).map(category => ({
          id: category.idCategoria, nombre: category.nombre, projectId: item.proyecto.idProyecto
        })));
      },
      error: error => this.filterOptionsError(error)
    });
    this.responsibleService.getAll().pipe(timeout(45000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: responsables => {
        this.reportResponsibleOptions = (responsables ?? []).map(r => ({
          id: r.idResponsable, nombre: `${r.primerNombre} ${r.primerApellido}`.trim()
        }));
      },
      error: error => this.filterOptionsError(error)
    });
  }

  private filterOptionsError(error: unknown): void {
    console.error('Error al cargar filtros de reportes:', error);
    this.reportOptionsError = 'No se pudieron cargar algunas opciones de los filtros. Recarga la página para reintentar.';
  }

  get projectSearchOptions(): ReportSearchOption[] {
    return this.reportProjectOptions.map(p => ({ value: String(p.id), label: p.nombre }));
  }
  get responsibleSearchOptions(): ReportSearchOption[] {
    return this.reportResponsibleOptions.map(p => ({ value: String(p.id), label: p.nombre }));
  }
  categorySearchOptions(projectId: number | null): ReportSearchOption[] {
    if (projectId === null) return [];
    const categorias = this.reportCategoryOptions.filter(c => c.projectId === projectId);
    return [...new Map(categorias.map(c => [c.id, { value: String(c.id), label: c.nombre }])).values()];
  }
  stringId(id: number | null): string | null { return id == null ? null : String(id); }
  selectExcelProject(value: string | null): void {
    this.excelProjectId = value == null ? null : Number(value);
    this.excelCategoryId = null;
    this.excelCategoryValid = true;
    this.excelCategoryResetKey++;
  }
  selectExcelCategory(value: string | null): void { this.excelCategoryId = value == null ? null : Number(value); }
  selectPdfProject(value: string | null): void {
    this.reportProjectId = value == null ? null : Number(value);
    this.reportCategoryId = null;
    this.pdfCategoryValid = true;
    this.pdfCategoryResetKey++;
  }
  selectPdfCategory(value: string | null): void { this.reportCategoryId = value == null ? null : Number(value); }
  selectPdfResponsible(value: string | null): void { this.reportResponsibleId = value == null ? null : Number(value); }

  selectPeriodReport(value: string | null): void {
    this.selectedPeriodReport = this.periodReportOptions.find(option => option.key === value)?.key ?? null;
    if (this.selectedPeriodReport == null) return;
    const option = this.periodReportOption;
    if (!option?.proyecto) {
      this.selectExcelProject(null);
      this.excelProjectValid = true;
      this.excelResetKey++;
    }
    if (!option?.categoria) {
      this.excelCategoryId = null;
      this.excelCategoryValid = true;
      this.excelCategoryResetKey++;
    }
    if (!option?.solicitud) this.excelTipoSolicitud = '';
  }
  clearExcelFilters(): void {
    const hoy = new Date();
    this.reportPeriod = 'ALL';
    this.reportYear = hoy.getFullYear();
    this.reportMonth = hoy.getMonth() + 1;
    this.selectExcelProject(null);
    this.excelTipoSolicitud = '';
    this.excelResetKey++;
    this.excelProjectValid = this.excelCategoryValid = true;
  }
  get reportPeriodSummary(): string {
    return this.getReportPeriodLabel();
  }
  clearReportFilters(): void {
    this.reportEstadosActa = [];
    this.reportPrioridades = [];
    this.reportProjectId = this.reportCategoryId = this.reportResponsibleId = null;
    this.pdfResetKey++;
    this.pdfCategoryResetKey++;
    this.pdfProjectValid = this.pdfCategoryValid = this.pdfResponsibleValid = true;
  }
  toggleReportFilter(list: string[], value: string): void {
    const index = list.indexOf(value);
    if (index >= 0) list.splice(index, 1);
    else list.push(value);
  }
  isReportFilterSelected(list: string[], value: string): boolean { return list.includes(value); }

  private getReportDateRange(): { fechaInicio?: string; fechaFin?: string } {
    if (this.reportPeriod === 'ALL') return {};
    if (this.reportPeriod === 'YEAR') return { fechaInicio: `${this.reportYear}-01-01`, fechaFin: `${this.reportYear}-12-31` };
    const month = String(this.reportMonth).padStart(2, '0');
    return { fechaInicio: `${this.reportYear}-${month}-01`,
      fechaFin: `${this.reportYear}-${month}-${new Date(this.reportYear, this.reportMonth, 0).getDate()}` };
  }
  private getReportPeriodLabel(): string {
    if (this.reportPeriod === 'ALL') return 'Todos los registros';
    if (this.reportPeriod === 'YEAR') return `Año ${this.reportYear}`;
    return `${this.reportMonths[this.reportMonth - 1].label} ${this.reportYear}`;
  }
  private getReportFilterLabel(): string {
    const parts = [this.getReportPeriodLabel()];
    if (this.reportEstadosActa.length) parts.push(`Estados: ${this.reportEstadosActa.join(', ')}`);
    if (this.reportPrioridades.length) parts.push(`Prioridades: ${this.reportPrioridades.join(', ')}`);
    if (this.reportProjectId) parts.push(`Proyecto: ${this.reportProjectOptions.find(p => p.id === this.reportProjectId)?.nombre}`);
    if (this.reportCategoryId) parts.push(`Categoría: ${this.reportCategoryOptions.find(c => c.id === this.reportCategoryId)?.nombre}`);
    if (this.reportResponsibleId) parts.push(`Responsable: ${this.reportResponsibleOptions.find(r => r.id === this.reportResponsibleId)?.nombre}`);
    return parts.join(' · ');
  }

  downloadPeriodReport(): void {
    if (this.selectedPeriodReport == null || this.downloadingPeriodReport) return;
    if (!this.excelProjectValid || !this.excelCategoryValid) {
      this.alert.info('Selecciona una opción', 'Elige el proyecto y la categoría de las sugerencias o limpia su búsqueda.');
      return;
    }
    this.downloadExcel(this.selectedPeriodReport);
  }
  downloadBeneficiarios(): void { this.downloadExcel('beneficiarios'); }
  downloadCategorias(): void { this.downloadExcel('categorias'); }
  downloadResponsables(): void { this.downloadExcel('responsables'); }
  downloadNucleos(): void { this.downloadExcel('nucleos'); }

  private downloadExcel(reporte: ReportKeys): void {
    if (this.isLoadingReport[reporte]) return;
    const option = this.periodReportOptions.find(item => item.key === reporte);
    const range = option ? this.getReportDateRange() : {};
    const filtro: FiltroReporteActas = {
      idProyecto: option?.proyecto ? this.excelProjectId ?? undefined : undefined,
      idCategoria: option?.categoria ? this.excelCategoryId ?? undefined : undefined,
      tipoSolicitud: option?.solicitud ? this.excelTipoSolicitud.trim() || undefined : undefined
    };
    const request = reporte === 'actas' ? this.actasService.getExcelActas(range.fechaInicio, range.fechaFin, filtro)
      : reporte === 'productProject' ? this.actasService.getExcelProductosProyecto(range.fechaInicio, range.fechaFin, filtro)
      : this.reportes.descargarExcel(reporte, { ...range, idProyecto: filtro.idProyecto, idCategoria: filtro.idCategoria });
    const nombresGenerales: Partial<Record<ReportKeys, string>> = { beneficiarios: 'Beneficiarios', categorias: 'Categorías',
      responsables: 'Usuarios', nucleos: 'Actores sociales' };
    const nombre = option?.label ?? nombresGenerales[reporte] ?? reporte;
    const filename = `${nombre} - ${option ? this.getReportPeriodLabel() : 'General'} - ${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.isLoadingReport[reporte] = true;
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isLoadingReport[reporte] = false)).subscribe({
      next: blob => this.downloadBlob(blob, filename),
      error: async error => {
        console.error('Error al descargar reporte Excel:', error);
        const mensaje = await mensajeErrorReporteExcel(error);
        if (mensaje === 'No hay registros para los filtros seleccionados.') this.alert.info('Sin datos', mensaje);
        else this.alert.error('Operación fallida', mensaje);
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  descargarReporte(): void {
    if (this.isLoadingPDF) return;
    if (!this.pdfProjectValid || !this.pdfCategoryValid || !this.pdfResponsibleValid) {
      this.alert.info('Selecciona una opción', 'Elige los filtros de las sugerencias o limpia su búsqueda.');
      return;
    }
    this.isLoadingPDF = true;
    const filtro: ReporteFiltroRequest = {
      alcance: this.reportPeriod, ...this.getReportDateRange(), estadoActa: [...this.reportEstadosActa],
      prioridades: [...this.reportPrioridades], idProyecto: this.reportProjectId ?? undefined,
      idCategoria: this.reportCategoryId ?? undefined, idResponsable: this.reportResponsibleId ?? undefined, incluirActoresSinFecha: true
    };
    const label = this.getReportFilterLabel();
    this.reportes.obtenerDashboardFiltrado(filtro).pipe(timeout(45000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => {
        this.pdfDashboard.generateDashboardReport(d, label, { lightweight: true })
          .catch(error => {
            console.error('Error al abrir el PDF:', error);
            this.alert.error('No se pudo exportar el PDF', pdfErrorMessage(error));
          }).finally(() => this.isLoadingPDF = false);
      },
      error: error => {
        this.isLoadingPDF = false;
        console.error('Error al generar el PDF:', error);
        this.alert.error('Operación fallida', 'No se pudo generar el informe general o la consulta tardó demasiado.');
      }
    });
  }
}
