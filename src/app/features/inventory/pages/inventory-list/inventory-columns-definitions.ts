import { ColumnDef } from '@tanstack/angular-table';
import { IProducto } from '../../../../core/models/products.model';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

export const defaultColumns: ColumnDef<IProducto>[] = [
  {
    id: 'idProducto',
    accessorFn: (row) => row.idProducto,
    cell: info => info.getValue(),
    header: 'ID',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'codigoProducto',
    accessorFn: (row) => row.codigoProducto,
    cell: info => info.getValue() || 'Sin código',
    header: 'Código',
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
    id: 'nombreProyecto',
    accessorFn: (row) => row.nombreProyecto,
    cell: info => info.getValue() || 'Sin proyecto',
    header: 'Proyecto',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'nombreCategoria',
    accessorFn: (row) => row.nombreCategoria,
    cell: info => info.getValue() || 'Sin categoría',
    header: 'Categoría',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'descripcion',
    accessorFn: (row) => row.descripcion,
    cell: info => info.getValue(),
    header: 'Descripción',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'stock',
    accessorFn: (row) => row.stock,
    cell: info => {
      const stock = info.getValue();
      return `${stock} ${stock === 1 ? 'unidad' : 'unidades'}`;
    },
    header: 'Stock',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'fechaIngreso',
    accessorFn: (row) => row.fechaIngreso,
    cell: info => info.getValue() || 'Sin fecha de ingreso',
    header: 'Fecha de Ingreso',
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
