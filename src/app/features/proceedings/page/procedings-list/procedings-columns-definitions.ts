import { ColumnDef, FilterFn } from '@tanstack/angular-table';
import { IActa, PrioridadActa, EstadoActa } from '../../../../core/models/acta.model';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

// Definir los objetos de etiquetas con los tipos correctos
const estadosLabel: Record<EstadoActa, string> = {
  'R': 'Recibido',
  'P': 'Procesado',
  'A': 'Autorizado',
  'RC': 'Rechazado',
  'E': 'Entregado'
};

const prioridadLabel: Record<PrioridadActa, string> = {
  'A': 'Alta',
  'M': 'Media',
  'B': 'Baja'
};

const estadoFilter: FilterFn<IActa> = (row, columnId, filterValue) => {
  const value = (row.getValue(columnId) as string)?.toUpperCase() || '';
  const search = filterValue.trim().toUpperCase();

  // Mapeo de etiquetas completas
  const mapEstados: Record<string, string> = {
    'R': 'RECIBIDO',
    'P': 'PROCESADO',
    'A': 'AUTORIZADO',
    'RC': 'RECHAZADO',
    'E': 'ENTREGADO',
  };

  // Obtener el label legible
  const label = mapEstados[value] || '';

  // Coincide si el texto del usuario está en el código o en el label
  return value.includes(search) || label.includes(search);
};

const prioridadFilter: FilterFn<IActa> = (row, columnId, filterValue) => {
  const value = (row.getValue(columnId) as string)?.toUpperCase() || '';
  const search = filterValue.trim().toUpperCase();

  // Mapeo de etiquetas completas
  const mapPrioridad: Record<string, string> = {
    'A': 'ALTA',
    'M': 'MEDIA',
    'B': 'BAJA',
  };

  const label = mapPrioridad[value] || '';

  // Coincidencia si el texto del usuario aparece en el código o la etiqueta
  return value.includes(search) || label.includes(search);
};

export const defaultColumns: ColumnDef<IActa>[] = [
  {
    id: 'idFecha',
    accessorFn: (row) => `${row.idActa} - ${row.fechaCreacion}`,
    header: 'Acta / Fecha',
    cell: info => {
      const [id, fecha] = (info.getValue() as string).split(' - ');
      return `<div>
                <span class="font-semibold text-gray-800">#${id}</span><br>
                <span class="text-xs text-gray-500">${fecha}</span>
              </div>`;
    },
    meta: { filterVariant: 'text' }
  },
  {
    id: 'beneficiario',
    accessorFn: (row) => `${row.beneficiario.primerNombre} ${row.beneficiario.primerApellido}`,
    header: 'Beneficiario',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'proyecto',
    accessorFn: (row) => row.proyecto.nombre,
    header: 'Proyecto',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'estado',
    accessorFn: (row) => row.estado,
    header: 'Estado',
    filterFn: estadoFilter,
    cell: info => {
      const estado = info.getValue() as EstadoActa;
      const colorMap = {
        'R': 'bg-yellow-100 text-yellow-800',
        'P': 'bg-blue-100 text-blue-800',
        'A': 'bg-green-100 text-green-800',
        'RC': 'bg-red-100 text-red-800',
        'E': 'bg-gray-200 text-gray-700',
      };
      return `<span class="px-2 py-1 rounded-md text-xs font-medium ${colorMap[estado]}">
                ${estadosLabel[estado]}
              </span>`;
    },
    meta: { filterVariant: 'text' }
  },
  {
    id: 'prioridad',
    accessorFn: (row) => row.prioridad,
    header: 'Prioridad',
    filterFn: prioridadFilter,
    cell: info => {
      const prioridad = info.getValue() as PrioridadActa;
      const colorMap = {
        'A': 'bg-red-100 text-red-700',
        'M': 'bg-yellow-100 text-yellow-700',
        'B': 'bg-green-100 text-green-700',
      };
      return `<span class="px-2 py-1 rounded-md text-xs font-medium ${colorMap[prioridad]}">
                ${prioridadLabel[prioridad]}
              </span>`;
    },
    meta: { filterVariant: 'text' }
  },
  {
    id: 'fechaEntrega',
    accessorFn: (row) => row.fechaEntrega || 'Pendiente',
    header: 'Entrega',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'acciones',
    header: 'Acciones',
    enableSorting: false,
    cell: () => 'actions',
  },
];
