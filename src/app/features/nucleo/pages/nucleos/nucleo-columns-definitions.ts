import { ColumnDef } from '@tanstack/angular-table';
import { INucleoUpdate } from '../../../../core/models/nucleo.model';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

export const defaultColumns: ColumnDef<INucleoUpdate>[] = [
  {
    id: 'idNucleo',
    accessorFn: (row) => row.idNucleo,
    cell: info => info.getValue(),
    header: 'ID',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'idZonaFk',
    accessorFn: (row) => row.idZonaFk,
    cell: info => info.getValue(),
    header: 'Id Zona',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'idBarrioFk',
    accessorFn: (row) => row.idBarrioFk,
    cell: info => info.getValue(),
    header: 'Id barrio',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'numeroIntegrantes',
    accessorFn: (row) => row.numeroIntegrantes,
    cell: info => info.getValue(),
    header: 'Número de integrantes',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'direccion',
    accessorFn: (row) => row.direccion,
    cell: info => info.getValue(),
    header: 'Dirección',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'nombreNucleo',
    accessorFn: (row) => row.nombreNucleo,
    cell: info => info.getValue(),
    header: 'Nombre núcleo',
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
  // {
  //   id: 'beneficiarios',
  //   accessorFn: (row) => row.beneficiarios,
  //   cell: info => info.getValue(),
  //   header: 'Beneficiarios',
  //   filterFn: 'includesString',
  //   meta: { filterVariant: 'text'}
  // },


];

