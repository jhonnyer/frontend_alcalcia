import { ColumnDef } from '@tanstack/angular-table';
import { IResponsable, TipoIdentificacion, EstadoResponsable, PerfilUsuario } from '../../../../core/models/responsable.model';


declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

// Definir etiquetas legibles para los enums
const tipoIdentificacionLabel: Record<TipoIdentificacion, string> = {
  'CC': 'Cédula de Ciudadanía',
  'PA': 'Pasaporte',
  'NIT': 'NIT',
  'TI': 'Tarjeta de Identidad',
  'CE': 'Cédula de Extranjería'
};

const estadoLabel: Record<EstadoResponsable, string> = {
  'A': 'Activo',
  'I': 'Inactivo'
};

const perfilUsuarioLabel: Record<PerfilUsuario, string> = {
  'ADMIN': 'Administrador',
  'RESP': 'Responsable'
};

export const defaultColumns: ColumnDef<IResponsable>[] = [
  {
    id: 'nombreCompleto',
    accessorFn: (r) =>
      `${r.primerNombre ?? ''} ${r.segundoNombre ?? ''} ${r.primerApellido ?? ''} ${r.segundoApellido ?? ''}`.trim(),
    cell: (info) => info.getValue(),
    header: 'Nombre Completo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'area',
    accessorFn: (r) => r.area,
    cell: (info) => info.getValue(),
    header: 'Área',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'cargo',
    accessorFn: (r) => r.cargo,
    cell: (info) => info.getValue(),
    header: 'Cargo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'telefono',
    accessorFn: (r) => r.telefono,
    cell: (info) => info.getValue(),
    header: 'Teléfono',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'email',
    accessorFn: (r) => r.email,
    cell: (info) => info.getValue(),
    header: 'Correo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'perfilUsuario',
    accessorFn: (r) => perfilUsuarioLabel[r.perfilUsuario],
    cell: (info) => info.getValue(),
    header: 'Perfil',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'estado',
    accessorFn: (r) => estadoLabel[r.estado],
    cell: (info) => {
      const valor = info.getValue();
      const color =
        valor === 'Activo'
          ? 'text-green-600 font-semibold'
          : 'text-red-600 font-semibold';
      return `<span class="${color}">${valor}</span>`;
    },
    header: 'Estado',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },
  {
    id: 'acciones',
    header: 'Acciones',
    enableSorting: false,
    enableHiding: false,
  },
];