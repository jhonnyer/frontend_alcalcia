import { ColumnDef } from '@tanstack/angular-table';
import { IProyectoAndCategoriaArray, EstadoProyecto, TipoProyecto } from '../../../../core/models/proyecto.model';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

// Definir las etiquetas para los estados y tipos
const estadoProyectoLabel: Record<EstadoProyecto, string> = {
  'A': 'Activo',
  'I': 'Inactivo',
  'P': 'Pendiente'
};

const tipoProyectoLabel: Record<TipoProyecto, string> = {
  'D': 'Departamental',
  'M': 'Municipal'
};

export const defaultColumns: ColumnDef<IProyectoAndCategoriaArray>[] = [
  {
    id: 'idProyecto',
    accessorFn: (row) => row.proyecto.idProyecto,
    cell: info => info.getValue(),
    header: 'ID',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'nombre',
    accessorFn: (row) => row.proyecto.nombre,
    cell: info => info.getValue(),
    header: 'Nombre',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'descripcion',
    accessorFn: (row) => row.proyecto.descripcion,
    cell: info => info.getValue(),
    header: 'Descripción',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'estado',
    accessorFn: (row) => row.proyecto.estado,
    cell: info => {
      const estado = info.getValue() as EstadoProyecto;
      const badgeClass = estado === 'A'
        ? 'status-badge-active'
        : estado === 'I'
          ? 'status-badge-inactive'
          : 'status-badge-warning';
      return `<span class="status-badge ${badgeClass}">${estadoProyectoLabel[estado]}</span>`;
    },
    header: 'Estado',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'fechaInicio',
    accessorFn: (row) => row.proyecto.fechaInicio,
    cell: info => info.getValue(),
    header: 'Fecha Inicio',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'tipoProyecto',
    accessorFn: (row) => row.proyecto.tipoProyecto,
    cell: info => {
      const tipo = info.getValue() as TipoProyecto;
      return tipoProyectoLabel[tipo];
    },
    header: 'Tipo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'categorias',
    accessorFn: (row) => row.categorias.map(cat => cat.nombre).join(', '),
    cell: info => info.getValue(),
    header: 'Categorías',
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
