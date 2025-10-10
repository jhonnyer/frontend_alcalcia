import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterBeneficiario', standalone: true })
export class FilterBeneficiarioPipe implements PipeTransform {
  transform(items: any[], search: string): any[] {
    if (!items || !search) return items;
    const term = search.toLowerCase();
    return items.filter(b =>
      `${b.primerNombre} ${b.primerApellido}`.toLowerCase().includes(term) ||
      b.numeroDocumento?.toString().includes(term)
    );
  }
}
