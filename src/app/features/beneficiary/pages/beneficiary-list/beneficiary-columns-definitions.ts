import { ColumnDef } from '@tanstack/angular-table';
import { IBeneficiario } from '../../../../core/models/beneficiary.models';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

export const defaultColumns: ColumnDef<IBeneficiario>[] = [
  {
    id: 'nombreCompleto',
    accessorFn: (row) =>
      `${row.primerNombre ?? ''} ${row.segundoNombre ?? ''} ${row.primerApellido ?? ''} ${row.segundoApellido ?? ''}`.trim(),
    cell: (info) => info.getValue(),
    header: 'Nombre completo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'numeroDocumento',
    accessorFn: (row) => `${row.tipoDocumento ?? ''} ${row.numeroDocumento ?? ''}`.trim(),
    cell: (info) => info.getValue(),
    header: 'Documento',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'edad',
    accessorFn: (row) => row.edad,
    cell: (info) =>
      `<span class="text-center block w-10">${info.getValue()}</span>`,
    header: 'Edad',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'sexo',
    accessorFn: (row) => row.sexo,
    cell: (info) => info.getValue(),
    header: 'Sexo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'nombreNucleo',
    accessorFn: (row) => row.nombreNucleo,
    cell: (info) => {
      const row = info.row.original;
      const nombre = row.nombreNucleo || 'Sin actor social';
      const ubicacion = [row.barrio, row.direccionNucleo].filter(Boolean).join(' · ');
      return `<span class="font-medium">#${row.idNucleoFk ?? '-'} - ${nombre}</span>${ubicacion ? `<span class="block text-xs text-slate-500">${ubicacion}</span>` : ''}`;
    },
    header: 'Núcleo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'victimaConflicto',
    accessorFn: (row) => (row.victimaConflicto ? 'Sí' : 'No'),
    cell: (info) =>
      `<span class="px-2 py-0.5 rounded text-xs ${
        info.getValue() === 'Sí'
          ? 'bg-red-100 text-red-700'
          : 'bg-green-100 text-green-700'
      }">${info.getValue()}</span>`,
    header: 'Víctima conflicto',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'acciones',
    enableSorting: false,
    enableHiding: false,
    cell: () => 'actions',
    header: 'Acciones',
  },
];
