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
    id: 'idResponsable',
    accessorFn: (row) => row.idResponsable,
    cell: info => info.getValue(),
    header: 'ID',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'nombreCompleto',
    accessorFn: (row) => `${row.primerNombre} ${row.segundoNombre || ''} ${row.primerApellido} ${row.segundoApellido || ''}`.trim(),
    cell: info => info.getValue(),
    header: 'Nombre Completo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'cargo',
    accessorFn: (row) => row.cargo,
    cell: info => info.getValue(),
    header: 'Cargo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'area',
    accessorFn: (row) => row.area,
    cell: info => info.getValue(),
    header: 'Área',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'telefono',
    accessorFn: (row) => `${row.telefono}`,
    cell: info => info.getValue(),
    header: 'Télefono',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'email',
    accessorFn: (row) => `${row.email}`,
    cell: info => info.getValue(),
    header: 'Email',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'tipoIdentificacion',
    accessorFn: (row) => `${row.tipoIdentificacion}`,
    cell: info => info.getValue(),
    header: 'Tipo identificación',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'numeroIdentificacion',
    accessorFn: (row) => `${row.numeroIdentificacion}`,
    cell: info => info.getValue(),
    header: 'Número identificación',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'usuario',
    accessorFn: (row) => row.usuario,
    cell: info => info.getValue(),
    header: 'Usuario',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'perfilUsuario',
    accessorFn: (row) => row.perfilUsuario,
    cell: info => {
      const perfil = info.getValue() as PerfilUsuario;
      return perfilUsuarioLabel[perfil];
    },
    header: 'Perfil',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' }
  },
  {
    id: 'estado',
    accessorFn: (row) => row.estado,
    cell: info => {
      const estado = info.getValue() as EstadoResponsable;
      return estadoLabel[estado];
    },
    header: 'Estado',
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
