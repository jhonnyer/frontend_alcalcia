import { ColumnDef } from '@tanstack/angular-table';
import { ICategorias } from '../../../core/models/categorias.model';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

export const defaultColumns: ColumnDef<ICategorias>[] = [
  {
    id: 'idCategoria',
    accessorFn: (row) => row.idCategoria,
    cell: info => info.getValue(),
    header: 'ID',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'nombre',
    accessorFn: (row) => row.nombre,
    cell: info => info.getValue(),
    header: 'Nombre',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'segundoNombre',
    accessorFn: (row) => row.descripcion,
    cell: info => info.getValue(),
    header: 'Segundo nombre',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'acciones',
    enableSorting: false,
    enableHiding: false,
    cell: (info) => 'actions', // Esto es importante para que se detecte la columna
    header: 'Acciones'
  }
];

