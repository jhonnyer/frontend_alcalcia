import { ChartData } from 'chart.js';
import { DashboardReport } from './reportes.model';

export function hasChartData(chart: ChartData): boolean {
  return chart.datasets.some(dataset =>
    dataset.data.some(value => typeof value === 'number' && Number.isFinite(value) && value > 0));
}

export function hasDashboardData(dashboard: DashboardReport): boolean {
  const resumen = dashboard.resumenGeneral;
  return [
    resumen?.totalBeneficiarios,
    resumen?.totalProyectos,
    resumen?.totalActas,
    resumen?.totalProductosEntregados,
    dashboard.poblacionVulnerable?.total
  ].some(total => Number(total) > 0)
    || (dashboard.proyectosResumen?.length ?? 0) > 0
    || (dashboard.distribucionEdad ?? []).some(item => item.total > 0)
    || (dashboard.actasPorMes ?? []).some(item => item.total > 0)
    || (dashboard.productosEntregados ?? []).some(item => item.totalEntregado > 0);
}

export function dashboardYears(dashboard: DashboardReport, currentYear = new Date().getFullYear()): number[] {
  const years = new Set((dashboard.actasPorMes ?? []).map(row => row.anio));
  for (const proyecto of dashboard.proyectosResumen ?? []) {
    const inicio = proyecto.fechaInicio ? Number(proyecto.fechaInicio.slice(0, 4)) : null;
    const fin = proyecto.fechaFin ? Number(proyecto.fechaFin.slice(0, 4)) : null;
    if (inicio === null && fin === null) continue;
    const desde = inicio ?? fin!;
    const hasta = fin ?? Math.max(desde, currentYear);
    if (!Number.isInteger(desde) || !Number.isInteger(hasta) || desde < 1 || hasta > 9999) continue;
    for (let year = desde; year <= hasta; year++) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}
