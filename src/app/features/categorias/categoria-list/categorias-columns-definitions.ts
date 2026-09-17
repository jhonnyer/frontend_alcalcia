import { ColumnDef } from '@tanstack/angular-table';
import { ICategorias } from './../../../core/models/categorias.model';

type CategoriaProyectoRow = ICategorias & {
  idProyecto?: number;
  nombreProyecto?: string;
  cantidadProductos?: number;
};

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

export const defaultColumns: ColumnDef<CategoriaProyectoRow>[] = [
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
    id: 'nombreProyecto',
    accessorFn: (row) => row.nombreProyecto,
    cell: info => info.getValue() || 'Sin proyecto',
    header: 'Proyecto',
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
    id: 'cantidadProductos',
    accessorFn: (row) => row.cantidadProductos ?? row.productos?.length ?? 0,
    cell: info => `${info.getValue()} productos`,
    header: 'Productos',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  // {
  //   id: 'productos',
  //   accessorFn: (row) => {
  //     if (!row.productos || row.productos.length === 0) {
  //       return 'Sin productos asociados';
  //     }
  //     return row.productos.map(producto =>
  //       `${producto.nombreProducto} (Stock: ${producto.stock})`
  //     ).join(', ');
  //   },
  //   cell: info => info.getValue(),
  //   header: 'Productos Asociados',
  //   filterFn: 'includesString',
  //   meta: { filterVariant: 'text' }
  // },
  // {
  //   id: 'cantidadProductos',
  //   accessorFn: (row) => row.productos?.length || 0,
  //   cell: info => `${info.getValue()} productos`,
  //   header: 'Cantidad de Productos',
  //   filterFn: 'includesString',
  //   meta: { filterVariant: 'text' }
  // },
  {
    id: 'acciones',
    enableSorting: false,
    enableHiding: false,
    cell: (info) => 'actions',
    header: 'Acciones'
  }
];
