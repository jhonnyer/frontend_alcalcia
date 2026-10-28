import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardReport } from '../../../core/models/reporte-global/reportes.model';
import { hasChartData } from '../../../core/models/reporte-global/dashboard.utils';

Chart.register(...registerables, ChartDataLabels);

const ESTADOS: Record<string, { nombre: string; color: string }> = {
  P: { nombre: 'Pendiente', color: '#d97706' },
  R: { nombre: 'Recibido', color: '#2563eb' },
  A: { nombre: 'Autorizado', color: '#7c3aed' },
  E: { nombre: 'Entregado', color: '#059669' },
  RC: { nombre: 'Rechazado', color: '#dc2626' }
};

interface FilaGrafica {
  nombre: string;
  cantidad: number;
}

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, BaseChartDirective],
  templateUrl: './dashboard-charts.component.html',
  styleUrl: './dashboard-charts.component.scss'
})
export class DashboardChartsComponent implements OnChanges {
  @Input({ required: true }) dashboard!: DashboardReport;
  readonly hasChartData = hasChartData;
  private readonly coloresPoblacion = ['#2563eb', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
  private readonly coloresEdad = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];
  private readonly coloresProductos = ['#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb'];
  anio = 'ALL';
  mes = 'ALL';
  estado = 'ALL';
  busquedaProducto = '';
  limiteProductos = 10;
  readonly meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anios: number[] = [];
  estados: string[] = [];
  poblacion: FilaGrafica[] = [];
  edades: FilaGrafica[] = [];
  productos: FilaGrafica[] = [];
  productosCoincidentes = 0;
  periodos: string[] = [];
  filasActas: Array<{ periodo: string; estado: string; cantidad: number }> = [];
  totalActas = 0;
  totalPersonas = 0;
  poblacionData: ChartData<'bar'> = { datasets: [] };
  edadesData: ChartData<'bar'> = { datasets: [] };
  productosData: ChartData<'bar'> = { datasets: [] };
  actasData: ChartData<'bar'> = { datasets: [] };

  readonly barrasOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: { callbacks: { label: context => `${context.dataset.label}: ${Number(context.raw).toLocaleString('es-CO')}` } }
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
      y: { grid: { display: false }, ticks: { autoSkip: false, callback(value) {
        const label = this.getLabelForValue(Number(value));
        return label.length > 32 ? `${label.slice(0, 29)}…` : label;
      } } }
    }
  };

  readonly actasOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10 } },
      datalabels: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45 } },
      y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Número de actas' } }
    }
  };

  ngOnChanges(): void {
    const d = this.dashboard;
    this.anios = [...new Set((d.actasPorMes ?? []).map(row => row.anio))].sort((a, b) => b - a);
    this.estados = [...new Set((d.actasPorMes ?? []).map(row => this.nombreEstado(row.estado)))];
    if (this.anio !== 'ALL' && !this.anios.includes(Number(this.anio))) this.anio = this.mes = 'ALL';
    if (this.estado !== 'ALL' && !this.estados.includes(this.estado)) this.estado = 'ALL';
    const pv = d.poblacionVulnerable;
    this.totalPersonas = pv?.total ?? 0;
    this.poblacion = [
      { nombre: 'Discapacidad registrada', cantidad: pv?.discapacidad ?? 0 },
      { nombre: 'Víctimas del conflicto', cantidad: pv?.victimas ?? 0 },
      { nombre: 'Menores de edad', cantidad: pv?.menoresEdad ?? pv?.menores ?? 0 },
      { nombre: 'Mujeres (sexo registrado)', cantidad: pv?.mujeres ?? 0 },
      { nombre: 'LGBTI registrado', cantidad: pv?.lgbti ?? 0 }
    ];
    this.edades = (d.distribucionEdad ?? []).map(row => ({ nombre: row.rangoEdad, cantidad: row.total }));
    this.poblacionData = this.barras(this.poblacion, 'Personas', this.coloresPoblacion);
    this.edadesData = this.barras(this.edades, 'Personas', this.edades.map((_, index) =>
      this.coloresEdad[index % this.coloresEdad.length]));
    this.actualizarActas();
    this.actualizarProductos();
  }

  nombreEstado(estado: string): string {
    return ESTADOS[estado]?.nombre ?? estado;
  }

  cambiarAnio(): void {
    if (this.anio === 'ALL') this.mes = 'ALL';
    this.actualizarActas();
  }

  limpiarActas(): void {
    this.anio = this.mes = this.estado = 'ALL';
    this.actualizarActas();
  }

  actualizarActas(): void {
    const rows = (this.dashboard.actasPorMes ?? []).filter(row =>
      (this.anio === 'ALL' || row.anio === Number(this.anio)) &&
      (this.mes === 'ALL' || row.mes === Number(this.mes)) &&
      (this.estado === 'ALL' || this.nombreEstado(row.estado) === this.estado));
    this.periodos = [...new Set(rows.map(row => `${row.anio}-${String(row.mes).padStart(2, '0')}`))].sort();
    const estados = [...new Set(rows.map(row => this.nombreEstado(row.estado)))];
    const cantidades = new Map<string, number>();
    for (const row of rows) {
      const key = `${row.anio}-${String(row.mes).padStart(2, '0')}/${this.nombreEstado(row.estado)}`;
      cantidades.set(key, (cantidades.get(key) ?? 0) + row.total);
    }
    const etiquetas = this.periodos.map(periodo => {
      const [anio, mes] = periodo.split('-');
      return `${this.meses[Number(mes) - 1].slice(0, 3)} ${anio}`;
    });
    this.filasActas = this.periodos.flatMap((periodo, index) => estados.map(estado => ({
      periodo: etiquetas[index], estado, cantidad: cantidades.get(`${periodo}/${estado}`) ?? 0
    })));
    this.totalActas = rows.reduce((total, row) => total + row.total, 0);
    this.actasData = {
      labels: etiquetas,
      datasets: estados.map(estado => ({
        label: estado,
        data: this.periodos.map(periodo => cantidades.get(`${periodo}/${estado}`) ?? 0),
        backgroundColor: Object.values(ESTADOS).find(item => item.nombre === estado)?.color ?? '#64748b',
        maxBarThickness: 48
      }))
    };
  }

  actualizarProductos(): void {
    const texto = this.busquedaProducto.trim().toLocaleLowerCase('es');
    const productos = (this.dashboard.productosEntregados ?? [])
      .filter(row => row.producto.toLocaleLowerCase('es').includes(texto))
      .slice().sort((a, b) => b.totalEntregado - a.totalEntregado || a.producto.localeCompare(b.producto));
    this.productosCoincidentes = productos.length;
    this.productos = (this.limiteProductos === 0 ? productos : productos.slice(0, this.limiteProductos))
      .map(row => ({ nombre: row.producto, cantidad: row.totalEntregado }));
    this.productosData = this.barras(this.productos, 'Unidades', this.productos.map((_, index) =>
      this.coloresProductos[index % this.coloresProductos.length]));
  }

  limpiarProductos(): void {
    this.busquedaProducto = '';
    this.limiteProductos = 10;
    this.actualizarProductos();
  }

  private barras(filas: FilaGrafica[], unidad: string, color: string | string[]): ChartData<'bar'> {
    return { labels: filas.map(row => row.nombre), datasets: [{
      label: unidad, data: filas.map(row => row.cantidad), backgroundColor: color,
      borderRadius: 4, maxBarThickness: 28
    }] };
  }
}
