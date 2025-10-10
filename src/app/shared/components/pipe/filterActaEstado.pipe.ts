import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterActaEstado',
  standalone: true
})
export class FilterActaEstadoPipe implements PipeTransform {
  transform(items: any[], filtro: string): any[] {
    if (!items || !filtro) return items;

    const term = filtro.toLowerCase().trim();

    // Mapa para traducir abreviaciones o nombres de estados
    const mapaEstados: { [key: string]: string } = {
      'p': 'pendiente',
      'pendiente': 'pendiente',
      'r': 'recibido',
      'recibido': 'recibido',
      'a': 'autorizado',
      'autorizado': 'autorizado',
      'e': 'entregado',
      'entregado': 'entregado',
      'rc': 'rechazado',
      'rechazado': 'rechazado'
    };

    const estadoNormalizado = mapaEstados[term] || term;

    return items.filter(a => {
      const estadoActa = (a.estado || '').toLowerCase();
      const descripcion = mapaEstados[estadoActa] || estadoActa;
      const idActa = a.idActa ? a.idActa.toString() : '';

      // Coincidencia por número o por estado
      return (
        idActa.includes(term) ||
        estadoActa.includes(estadoNormalizado) ||
        descripcion.includes(estadoNormalizado)
      );
    });
  }
}
