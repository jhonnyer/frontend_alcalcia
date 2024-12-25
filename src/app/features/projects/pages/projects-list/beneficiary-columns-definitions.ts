import { ColumnDef } from '@tanstack/angular-table';
import { IBeneficiario } from '../../../../core/models/beneficiary.models';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

export const defaultColumns: ColumnDef<IBeneficiario>[] = [
  {
    id: 'idBeneficiario',
    accessorFn: (row) => row.idBeneficiario,
    cell: info => info.getValue(),
    header: 'ID',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'primerNombre',
    accessorFn: (row) => row.primerNombre,
    cell: info => info.getValue(),
    header: 'Primer nombre',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'segundoNombre',
    accessorFn: (row) => row.segundoNombre,
    cell: info => info.getValue(),
    header: 'Segundo nombre',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'primerApellido',
    accessorFn: (row) => row.primerApellido,
    cell: info => info.getValue(),
    header: 'Primer apellido',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'segundoApellido',
    accessorFn: (row) => row.segundoApellido,
    cell: info => info.getValue(),
    header: 'Segundo apellido',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'sexo',
    accessorFn: (row) => row.sexo,
    cell: info => info.getValue(),
    header: 'Sexo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'genero',
    accessorFn: (row) => row.genero,
    cell: info => info.getValue(),
    header: 'Genero',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'etnia',
    accessorFn: (row) => row.etnia,
    cell: info => info.getValue(),
    header: 'Etnia',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'edad',
    accessorFn: (row) => row.edad,
    cell: info => info.getValue(),
    header: 'Edad',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'victimaConflicto',
    accessorFn: (row) => row.victimaConflicto.toString(),
    cell: info => info.getValue(),
    header: 'Victima del conflicto',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'tipoDocumento',
    accessorFn: (row) => row.tipoDocumento,
    cell: info => info.getValue(),
    header: 'Tipo documento',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'numeroDocumento',
    accessorFn: (row) => row.numeroDocumento,
    cell: info => info.getValue(),
    header: 'Número documento',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'fechaNacimiento',
    accessorFn: (row) => row.fechaNacimiento,
    cell: info => info.getValue(),
    header: 'Fecha nacimiento',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'telefono',
    accessorFn: (row) => row.telefono,
    cell: info => info.getValue(),
    header: 'Télefono',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'email',
    accessorFn: (row) => row.email,
    cell: info => info.getValue(),
    header: 'Email',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'esVivo',
    accessorFn: (row) => row.esVivo.toString(),
    cell: info => info.getValue(),
    header: 'Está vivo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'idNucleoFk',
    accessorFn: (row) => row.idNucleoFk,
    cell: info => info.getValue(),
    header: 'Id núucleo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  /*
  {
    id: 'nombreNucleo',
    accessorFn: (row) => row.nombreNucleo,
    cell: info => info.getValue(),
    header: 'Nombre núcleo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'direccionNucleo',
    accessorFn: (row) => row.direccionNucleo,
    cell: info => info.getValue(),
    header: 'Dirección núcleo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'barrio',
    accessorFn: (row) => row.barrio,
    cell: info => info.getValue(),
    header: 'Barrio',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'zona',
    accessorFn: (row) => row.zona,
    cell: info => info.getValue(),
    header: 'Zona',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'ubicacion',
    accessorFn: (row) => row.ubicacion,
    cell: info => info.getValue(),
    header: 'Ubicación',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  */
  {
    id: 'acciones',
    enableSorting: false,
    enableHiding: false,
    cell: (info) => 'actions', // Esto es importante para que se detecte la columna
    header: 'Acciones'
  }
];

