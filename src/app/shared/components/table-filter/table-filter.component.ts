import { Component, input, signal } from '@angular/core';
import { Column } from '@tanstack/angular-table';

@Component({
  selector: 'app-table-filter',
  standalone: true,
  imports: [],
  templateUrl: './table-filter.component.html',
  styleUrl: './table-filter.component.scss'
})
export class TableFilterComponent {
  column = input.required<Column<any, any>>();
  filterValue = signal('');

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value);
    this.column().setFilterValue(value || undefined);
  }

  clearFilter(): void {
    this.filterValue.set('');
    this.column().setFilterValue(undefined);
  }
}
