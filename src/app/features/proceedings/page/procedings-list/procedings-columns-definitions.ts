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
    id: 'numeroDocumento',
    accessorFn: (row) => row.beneficiario.numeroDocumento,
    header: 'Documento',
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
        'R': 'status-badge-warning',
        'P': 'status-badge-warning',
        'A': 'status-badge-warning',
        'RC': 'status-badge-inactive',
        'E': 'status-badge-active',
      };
      return `<span class="status-badge ${colorMap[estado]}">
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
        'A': 'status-badge-inactive',
        'M': 'status-badge-warning',
        'B': 'status-badge-active',
      };
      return `<span class="status-badge ${colorMap[prioridad]}">
                ${prioridadLabel[prioridad]}
              </span>`;
    },
    meta: { filterVariant: 'text' }
  },
  {
    id: 'fechaEntrega',
    accessorFn: (row) => row.fechaEntrega || 'Pendiente',
    header: 'Entrega',
    cell: info => info.getValue() === 'Pendiente'
      ? '<span class="status-badge status-badge-warning">Pendiente</span>'
      : info.getValue(),
    meta: { filterVariant: 'text' }
  },
  {
    id: 'acciones',
    header: 'Acciones',
    enableSorting: false,
    cell: () => 'actions',
  },
];
