import { ColumnDef } from '@tanstack/angular-table';
import { IBeneficiarioProyecto } from '../../../../core/models/beneficiarioProyecto.model';
import { EstadoProyecto } from '../../../../core/models/proyecto.model';

declare module '@tanstack/angular-table' {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

// 🔹 Utilidad para formato de fecha y comparación segura
function formatFecha(value: any): string {
  if (!value) return '';
  const fecha = value instanceof Date ? value : new Date(value + 'T00:00:00'); // fuerza hora local
  if (isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
}

export const defaultColumns: ColumnDef<IBeneficiarioProyecto>[] = [
  {
    id: 'numDocumentoBeneficiario',
    accessorFn: (row) => row.numDocumentoBeneficiario,
    cell: (info) => info.getValue() || '—',
    header: 'Documento',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },

  {
    id: 'nombreProyecto',
    accessorFn: (row) => row.nombreProyecto,
    cell: (info) => info.getValue() || '—',
    header: 'Proyecto',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },

  {
    id: 'nombreNucleo',
    accessorFn: (row) => row.nombreNucleo,
    cell: (info) => info.getValue() || '—',
    header: 'Núcleo',
    filterFn: 'includesString',
    meta: { filterVariant: 'text' },
  },

  // 🔸 Estado del Proyecto (A/I/P)
  {
    id: 'estadoProyecto',
    accessorFn: (row) => row.estadoProyecto,
    cell: (info) => {
      const estado = info.getValue() as EstadoProyecto;
      const color =
        estado === 'A'
          ? 'text-green-600 font-medium'
          : estado === 'I'
          ? 'text-red-600 font-medium'
          : 'text-yellow-600 font-medium';
      const texto =
        estado === 'A'
          ? 'Activo'
          : estado === 'I'
          ? 'Inactivo'
          : 'Pendiente';
      return `<span class="${color}">${texto}</span>`;
    },
    header: 'Estado Proyecto',
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const val = (row.getValue(columnId) as string)?.toUpperCase() ?? '';
      const search = (filterValue as string).toUpperCase().trim();

      // 🔹 Coincidencias parciales
      if (search.startsWith('A')) return val === 'A';
      if (search.startsWith('I')) return val === 'I';
      if (search.startsWith('P')) return val === 'P';

      // 🔹 Coincidencias completas
      if (search.includes('ACTIVO')) return val === 'A';
      if (search.includes('INACTIVO')) return val === 'I';
      if (search.includes('PENDIENTE')) return val === 'P';

      return false;
    },
    meta: { filterVariant: 'text' },
  },

  // 🔸 Estado del Beneficiario (true / false)
  {
    id: 'esBeneficiarioActivo',
    accessorFn: (row) => row.esBeneficiarioActivo,
    cell: (info) =>
      info.getValue()
        ? '<span class="text-green-600 font-medium">Activo</span>'
        : '<span class="text-red-600 font-medium">Inactivo</span>',
    header: 'Estado Beneficiario',
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const val = row.getValue(columnId) as boolean;
      const search = (filterValue as string).toUpperCase().trim();

      if (search.startsWith('A')) return val === true;
      if (search.startsWith('I')) return val === false;
      if (search.includes('ACTIVO')) return val === true;
      if (search.includes('INACTIVO')) return val === false;

      return false;
    },
    meta: { filterVariant: 'text' },
  },

  // 🔸 Fecha Inicio (compatible con texto)
  {
    id: 'fechaInicio',
    accessorFn: (row) => row.fechaInicio,
    cell: (info) => {
      const fechaFormateada = formatFecha(info.getValue());
      return fechaFormateada || '<span class="text-gray-400 italic">Sin fecha</span>';
    },
    header: 'Fecha Inicio',
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const valor = formatFecha(row.getValue(columnId));
      return valor.includes(filterValue as string);
    },
    meta: { filterVariant: 'text' },
  },

  // 🔸 Fecha Fin (compatible con texto)
  {
    id: 'fechaFin',
    accessorFn: (row) => row.fechaFin,
    cell: (info) => {
      const fechaFormateada = formatFecha(info.getValue());
      return fechaFormateada || '<span class="text-gray-400 italic">Sin fecha</span>';
    },
    header: 'Fecha Fin',
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const valor = formatFecha(row.getValue(columnId));
      return valor.includes(filterValue as string);
    },
    meta: { filterVariant: 'text' },
  },

  // 🔸 Observaciones
  {
    id: 'observaciones',
    accessorFn: (row) => row.observaciones,
    cell: (info) =>
      info.getValue()
        ? info.getValue()
        : '<span class="text-gray-400 italic">Sin observaciones</span>',
    header: 'Observaciones',
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const valor = (row.getValue(columnId) as string)?.toLowerCase() ?? '';
      return valor.includes((filterValue as string).toLowerCase());
    },
    meta: { filterVariant: 'text' },
  },

  // 🔸 Acciones
  {
    id: 'acciones',
    enableSorting: false,
    enableHiding: false,
    cell: () => 'actions',
    header: 'Acciones',
  },
];
