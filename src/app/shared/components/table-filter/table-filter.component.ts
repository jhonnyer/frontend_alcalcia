import { Component, input } from '@angular/core';
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

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.column().setFilterValue(value || undefined);
  }

  clearFilter(): void {
    this.column().setFilterValue(undefined);
  }
}
