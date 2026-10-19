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
