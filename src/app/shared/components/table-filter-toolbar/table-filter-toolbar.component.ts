import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-table-filter-toolbar',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
      <div class="flex min-w-0 items-center gap-2 text-xs text-slate-600">
        <mat-icon class="!h-5 !w-5 shrink-0 text-[20px] text-slate-400" aria-hidden="true">filter_list</mat-icon>
        @if (activeCount() > 0) {
          <span class="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
            {{ activeCount() }} {{ activeCount() === 1 ? 'filtro activo' : 'filtros activos' }}
          </span>
        } @else {
          <span>Sin filtros activos · usa los campos de cada columna para buscar</span>
        }
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
        [disabled]="activeCount() === 0"
        (click)="clearFilters.emit()"
        title="Quitar todos los filtros de la tabla"
      >
        <mat-icon class="!h-4 !w-4 text-[16px]" aria-hidden="true">filter_alt_off</mat-icon>
        Limpiar filtros
      </button>
    </div>
  `,
})
export class TableFilterToolbarComponent {
  activeCount = input(0);
  clearFilters = output<void>();
}
