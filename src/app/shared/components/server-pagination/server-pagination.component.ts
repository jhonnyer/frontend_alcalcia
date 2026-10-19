import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-server-pagination',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <footer class="pagination-footer">
      <div class="pagination-info">
        <p>{{ rangeStart() }}–{{ rangeEnd() }} de <strong>{{ totalElements() }}</strong> registros</p>
        <span role="status" aria-live="polite" class="pagination-status">
          @if (disabled()) { Actualizando resultados... }
        </span>
      </div>
      <label class="pagination-size">
        Filas por página
        <select [value]="pageSize()" [disabled]="disabled()" (change)="pageSizeChange.emit($event)">
          @for (size of pageSizes(); track size) { <option [value]="size">{{ size }}</option> }
        </select>
      </label>
      <nav class="pagination-navigation" aria-label="Paginación de resultados">
      <div class="pagination-buttons">
      <button type="button" aria-label="Primera página" title="Primera página"
        [disabled]="disabled() || pageIndex() === 0" (click)="pageChange.emit(0)">
        <mat-icon>first_page</mat-icon>
      </button>
      <button type="button" aria-label="Página anterior" title="Página anterior"
        [disabled]="disabled() || pageIndex() === 0" (click)="pageChange.emit(pageIndex() - 1)"><mat-icon>chevron_left</mat-icon></button>
      </div>
      <form class="pagination-jump" (submit)="$event.preventDefault(); goToPage(pageInput.value)">
        <label>
          Página
          <input #pageInput type="number" min="1" [max]="totalPages()" step="1" required
            [value]="pageIndex() + 1" [disabled]="disabled()" aria-label="Número de página"
            class="pagination-page-input">
          de {{ totalPages() }}
        </label>
        <button type="submit" class="pagination-go" [disabled]="disabled()">Ir</button>
      </form>
      <div class="pagination-buttons">
      <button type="button" aria-label="Página siguiente" title="Página siguiente"
        [disabled]="disabled() || pageIndex() >= totalPages() - 1"
        (click)="pageChange.emit(pageIndex() + 1)"><mat-icon>chevron_right</mat-icon></button>
      <button type="button" aria-label="Última página" title="Última página"
        [disabled]="disabled() || pageIndex() >= totalPages() - 1" (click)="pageChange.emit(totalPages() - 1)">
        <mat-icon>last_page</mat-icon>
      </button>
      </div>
      </nav>
      @if (validationMessage()) {
        <p role="alert" class="w-full text-xs text-red-600">{{ validationMessage() }}</p>
      }
    </footer>
  `,
  styles: `
    :host { display: block; width: 100%; }
    .pagination-footer {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem;
      padding: 1rem; margin-top: 0.75rem; border: 1px solid #e2e8f0;
      border-radius: 0.75rem; background: #fff; color: #475569; font-size: 0.8125rem;
    }
    .pagination-info { margin-right: auto; }
    .pagination-info p { margin: 0; }
    .pagination-info strong { font-weight: 600; color: #0f172a; }
    .pagination-status { display: block; min-height: 1rem; font-size: 0.6875rem; color: #2563eb; }
    .pagination-size, .pagination-navigation, .pagination-jump, .pagination-jump label,
    .pagination-buttons { display: flex; align-items: center; gap: 0.5rem; }
    .pagination-navigation { flex-wrap: wrap; justify-content: center; }
    .pagination-size { white-space: nowrap; font-size: 0.75rem; }
    input, select, button {
      min-height: 2.25rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; background: #fff;
    }
    input, select { padding: 0.375rem 0.5rem; color: #334155; }
    .pagination-page-input { width: 4rem; text-align: center; }
    button {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 2.25rem; padding: 0.25rem; color: #475569;
      transition: background-color 150ms;
    }
    button:hover:not(:disabled) { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
    .pagination-go { padding: 0.375rem 0.75rem; background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; font-weight: 600; }
    button:disabled, input:disabled, select:disabled { opacity: 0.45; cursor: not-allowed; }
    button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
    @media (max-width: 640px) {
      .pagination-footer { justify-content: space-between; padding: 0.75rem; gap: 0.75rem; }
      .pagination-navigation { width: 100%; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
    }
  `
})
export class ServerPaginationComponent {
  pageIndex = input.required<number>();
  totalPages = input.required<number>();
  disabled = input(false);
  totalElements = input.required<number>();
  pageSize = input.required<number>();
  pageSizes = input.required<number[]>();
  pageSizeChange = output<Event>();
  pageChange = output<number>();
  validationMessage = signal('');

  rangeStart(): number {
    return this.totalElements() ? this.pageIndex() * this.pageSize() + 1 : 0;
  }

  rangeEnd(): number {
    return Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalElements());
  }

  goToPage(value: string): void {
    const page = Number(value);
    if (!Number.isInteger(page) || page < 1 || page > this.totalPages()) {
      this.validationMessage.set(`Ingresa una página entre 1 y ${this.totalPages()}.`);
      return;
    }
    this.validationMessage.set('');
    if (!this.disabled()) this.pageChange.emit(page - 1);
  }
}
