import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    @defer (on viewport) {
      <canvas baseChart [type]="type" [data]="data" [options]="options" (chartClick)="chartClick.emit($event)"
        role="img" [attr.aria-label]="description"></canvas>
    } @placeholder {
      <p role="status">La gráfica se mostrará al llegar a esta sección.</p>
    } @error {
      <p role="alert">No se pudo cargar la gráfica. Consulta los datos en Ver cifras o recarga la página.</p>
    }
  `,
  styles: `
    :host { display: block; height: 100%; min-width: 0; }
    p { display: flex; height: 100%; align-items: center; justify-content: center;
      margin: 0; padding: 1rem; text-align: center; color: #64748b; font-size: .8rem; }
  `
})
export class DashboardChartComponent {
  @Input() type: 'bar' | 'doughnut' = 'bar';
  @Input({ required: true }) data!: ChartData<'bar' | 'doughnut'>;
  @Input({ required: true }) options!: ChartOptions<'bar' | 'doughnut'>;
  @Input({ required: true }) description!: string;
  @Output() readonly chartClick = new EventEmitter<{ active?: object[] }>();
}
