import { ColumnDef } from '@tanstack/angular-table';
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


export const defaultColumns: ColumnDef<IActa>[] = [
  {
    id: 'idActa',
    accessorFn: (row) => row.idActa,
    cell: info => info.getValue(),
    header: 'ID',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'fechaCreacion',
    accessorFn: (row) => row.fechaCreacion,
    cell: info => info.getValue(),
    header: 'Fecha Creación',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'estado',
    accessorFn: (row) => row.estado,
    cell: info => {
      const estado = info.getValue() as EstadoActa;
      return estadosLabel[estado];
    },
    header: 'Estado',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'fechaEntrega',
    accessorFn: (row) => row.fechaEntrega,
    cell: info => info.getValue() || 'No establecida',
    header: 'Fecha Entrega',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'beneficiario',
    accessorFn: (row) => `${row.beneficiario.primerNombre} ${row.beneficiario.primerApellido}`,
    cell: info => info.getValue(),
    header: 'Beneficiario',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'proyecto',
    accessorFn: (row) => row.proyecto.nombre,
    cell: info => info.getValue(),
    header: 'Proyecto',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'responsable',
    accessorFn: (row) => `${row.responsable.primerNombre} ${row.responsable.primerApellido}`,
    cell: info => info.getValue(),
    header: 'Responsable',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'ubicacionEntrega',
    accessorFn: (row) => row.ubicacionEntrega,
    cell: info => info.getValue(),
    header: 'Ubicación Entrega',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'observaciones',
    accessorFn: (row) => row.observaciones,
    cell: info => info.getValue() || 'Sin observaciones',
    header: 'Observaciones',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'prioridad',
    accessorFn: (row) => row.prioridad,
    cell: info => {
      const prioridad = info.getValue() as PrioridadActa;
      return prioridadLabel[prioridad];
    },
    header: 'Prioridad',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'tipoSolicitud',
    accessorFn: (row) => row.tipoSolicitud,
    cell: info => info.getValue(),
    header: 'Tipo Solicitud',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'responsableVisita',
    accessorFn: (row) => row.responsableVisita,
    cell: info => info.getValue(),
    header: 'Responsable Visita',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'acciones',
    enableSorting: false,
    enableHiding: false,
    cell: (info) => 'actions',
    header: 'Acciones'
  }
];

