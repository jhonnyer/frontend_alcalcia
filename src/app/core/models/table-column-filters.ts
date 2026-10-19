import { HttpParams } from '@angular/common/http';
import { ColumnFiltersState } from '@tanstack/angular-table';

export interface TableColumnFilters {
  columnas?: Record<string, string>;
}

export function toColumnFilters(filters: ColumnFiltersState): Record<string, string> {
  return Object.fromEntries(filters
    .filter(filter => typeof filter.value === 'string' && filter.value.trim())
    .map(filter => [filter.id, String(filter.value).trim()]));
}

export function withColumnFilters(params: HttpParams, filters: TableColumnFilters): HttpParams {
  for (const [column, value] of Object.entries(filters.columnas ?? {})) {
    if (value.trim()) params = params.set(`col.${column}`, value.trim());
  }
  return params;
}
