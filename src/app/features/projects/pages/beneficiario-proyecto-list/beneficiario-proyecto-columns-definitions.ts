import { ColumnDef } from '@tanstack/angular-table';
import { IBeneficiarioProyecto } from '../../../../core/models/beneficiarioProyecto.model';
import { EstadoProyecto } from '../../../../core/models/proyecto.model';

declare module '@tanstack/angular-table' {
 interface ColumnMeta<TData, TValue> {
   filterVariant?: 'text' | 'range' | 'select';
 }
}

export const defaultColumns: ColumnDef<IBeneficiarioProyecto>[] = [
 {
   id: 'idBeneficiarioProyecto',
   accessorFn: (row) => row.idBeneficiarioProyecto,
   cell: info => info.getValue(),
   header: 'ID',
   filterFn: 'includesString',
   meta: { filterVariant: 'text' }
 },
 {
   id: 'numDocumentoBeneficiario',
   accessorFn: (row) => row.numDocumentoBeneficiario,
   cell: info => info.getValue(),
   header: 'Documento',
   filterFn: 'includesString',
   meta: { filterVariant: 'text' }
 },
 {
   id: 'nombreProyecto',
   accessorFn: (row) => row.nombreProyecto,
   cell: info => info.getValue(),
   header: 'Proyecto',
   filterFn: 'includesString',
   meta: { filterVariant: 'text' }
 },
 {
  id: 'estadoProyecto',
  accessorFn: (row) => row.estadoProyecto,
  cell: info => {
    const estado = info.getValue() as EstadoProyecto;
    return estado === 'A' ? 'Activo' : estado === 'I' ? 'Inactivo' : 'Pendiente';
  },
  header: 'Estado Proyecto',
  filterFn: 'includesString',
  meta: { filterVariant: 'text' }
},
 {
   id: 'esBeneficiarioActivo',
   accessorFn: (row) => row.esBeneficiarioActivo,
   cell: info => info.getValue() ? 'Activo' : 'Inactivo',
   header: 'Estado Beneficiario',
   filterFn: 'includesString',
   meta: { filterVariant: 'text' }
 },
 {
   id: 'fechaInicio',
   accessorFn: (row) => row.fechaInicio,
   cell: info => info.getValue(),
   header: 'Fecha Inicio',
   filterFn: 'includesString',
   meta: { filterVariant: 'text' }
 },
 {
   id: 'fechaFin',
   accessorFn: (row) => row.fechaFin || 'Sin fecha fin',
   cell: info => info.getValue(),
   header: 'Fecha Fin',
   filterFn: 'includesString',
   meta: { filterVariant: 'text' }
 },
 {
   id: 'observaciones',
   accessorFn: (row) => row.observaciones || 'Sin observaciones',
   cell: info => info.getValue(),
   header: 'Observaciones',
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
