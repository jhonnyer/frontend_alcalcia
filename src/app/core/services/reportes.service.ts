import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { TokenService } from './token.service';
import { DashboardReport, ReporteActasPorProyecto, ReporteBarrios, ReporteEdad, ReporteEntregaProyecto, ReportePoblacionVulnerable, ReporteProducto, ReporteProyecto, ReporteResponsable, ReporteSolicitud, ReporteTemporal, ReporteZona, ResumenEstadoProyecto, ResumenGeneral, ResumenProyecto } from '../models/reporte-global/reportes.model';

export interface ReporteFiltroRequest {
  alcance?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estadoActa?: string[];
  prioridades?: string[];
  idProyecto?: number;
  idCategoria?: number;
  idResponsable?: number;
  incluirActoresSinFecha?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly URL = environment.URL_API;
  private readonly EP = `${this.URL}/reportes/dashboard`;
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  /** Cachea la última respuesta del dashboard para reutilizarla */
  private dashboard$?: Observable<DashboardReport>;

  constructor() {
    this.tokenService.tokenChanges$.subscribe(() => this.invalidateCache());
  }

  /** Llama una vez al endpoint y cachea el resultado */
  obtenerDashboard(): Observable<DashboardReport> {
    if (!this.dashboard$) {
      this.dashboard$ = this.http
        .get<DashboardReport>(this.EP, { context: checkToken() })
        .pipe(
          map(d => this.normalizeDashboard(d)),
          shareReplay(1)
        );
    }
    return this.dashboard$;
  }

  obtenerDashboardFiltrado(filtro: ReporteFiltroRequest): Observable<DashboardReport> {
    return this.http
      .post<DashboardReport>(`${this.EP}/filtrado`, filtro, { context: checkToken() })
      .pipe(map(d => this.normalizeDashboard(d)));
  }

  // ---- Selectores (derivados del mismo dashboard) ----

  getResumenGeneral(): Observable<ResumenGeneral | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.resumenGeneral));
  }

  getProyectosResumen(): Observable<ResumenProyecto[] | undefined> {
    return this.obtenerDashboard().pipe(
      map(d => (d.proyectosResumen ?? []).map(p => this.normalizeProyectoResumen(p)))
    );
  }

  getResumenPorEstado(): Observable<ResumenEstadoProyecto | undefined> {
    return this.obtenerDashboard().pipe(
      map(d => {
        const r = d.resumenEstadoProyeto ?? d.resumenEstadoProyecto; // soporta ambas keys
        if (!r) return undefined;
        return {
          ...r,
          proyectosActivos: (r.proyectosActivos ?? []).map(p => this.normalizeProyectoResumen(p)),
          proyectosInactivos: (r.proyectosInactivos ?? []).map(p => this.normalizeProyectoResumen(p))
        };
      })
    );
  }

  getPoblacionVulnerable(): Observable<ReportePoblacionVulnerable | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.poblacionVulnerable));
  }

  getDistribucionEdad(): Observable<ReporteEdad[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.distribucionEdad));
  }

  getPorZona(): Observable<ReporteZona[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.porZona));
  }

  getPorBarrio(): Observable<ReporteBarrios[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.porBarrio));
  }

  getBeneficiariosPorProyecto(): Observable<ReporteProyecto[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.beneficiariosPorProyecto));
  }

  getProductosEntregados(): Observable<ReporteProducto[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.productosEntregados));
  }

  getActasPorMes(): Observable<ReporteTemporal[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.actasPorMes));
  }

  getSolicitudesPorTipo(): Observable<ReporteSolicitud[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.solicitudesPorTipo));
  }

  getActasPorResponsable(): Observable<ReporteResponsable[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.actasPorResponsable));
  }

  getEntregasPorProyecto(): Observable<ReporteEntregaProyecto[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.entregasPorProyecto));
  }

  getActasPorEstadoProyecto(): Observable<ReporteActasPorProyecto[] | undefined> {
    return this.obtenerDashboard().pipe(map(d => d.actasPorEstadoProyecto));
  }

  // ===== Normalizadores (si necesitas tocar fechas/orden, etc.) =====

  private normalizeDashboard(d: DashboardReport): DashboardReport {
    // Si en el futuro quieres normalizar algo global (fechas, ordenar, labels), hazlo aquí.
    return d;
  }

  private normalizeProyectoResumen<P extends { fechaInicio?: string | null; fechaFin?: string | null }>(p: any): any {
    // Si quieres formatear fechas a 'YYYY-MM-DD':
    p.fechaInicio = p.fechaInicio ? this.formatDate(p.fechaInicio) : p.fechaInicio;
    p.fechaFin    = p.fechaFin ? this.formatDate(p.fechaFin) : p.fechaFin;
    // Ordena categorías o beneficiarios si lo deseas:
    if (Array.isArray(p.categorias)) {
      p.categorias = [...p.categorias].sort((a, b) => a.nombreCategoria?.localeCompare(b.nombreCategoria ?? '') ?? 0);
    }
    if (Array.isArray(p.beneficiarios)) {
      p.beneficiarios = [...p.beneficiarios].sort((a, b) => a.nombreCompleto?.localeCompare(b.nombreCompleto ?? '') ?? 0);
    }
    return p;
  }

  private formatDate(dateString: string): string {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toISOString().split('T')[0];
  }

  invalidateCache(): void {
    this.dashboard$ = undefined;
  }
}
