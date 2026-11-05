import { ImportacionError } from './importacion-masiva.model';

export type TipoImportacionOperativa = 'ASOCIACIONES' | 'ACTAS';

export interface FilaImportacionOperativa {
  numeroFila: number;
  hojaOrigen?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  proyecto: string;
  categoria: string;
  producto: string;
  cantidad: string;
  referenciaActa: string;
  fechaSolicitud: string;
  ubicacionEntrega: string;
  prioridad: string;
  tipoSolicitud: string;
  responsableVisita: string;
  observaciones: string;
  fechaInicioAsociacion: string;
}

export interface ResultadoImportacionOperativa {
  id: string;
  tipo: TipoImportacionOperativa;
  nombreArchivo: string;
  estado: 'VALIDADA' | 'CONFIRMADA' | 'EXPIRADA';
  versionDatos: number;
  idResponsable: number | null;
  fechaCreacion: string;
  fechaExpiracion: string;
  fechaConfirmacion: string | null;
  totalFilas: number;
  totalOperaciones: number;
  filas: FilaImportacionOperativa[];
  errores: ImportacionError[];
  idsCreados: number[];
  actasPorGrupo: Record<string, number>;
}

export interface ResumenImportacionOperativa {
  id: string;
  nombreArchivo: string;
  estado: ResultadoImportacionOperativa['estado'];
  fechaCreacion: string;
  fechaConfirmacion: string | null;
  totalFilas: number;
  totalOperaciones: number;
}

export interface OpcionImportacionOperativa {
  id: number;
  etiqueta: string;
  padreId: number | null;
  stock: number | null;
}

export interface CatalogosImportacionOperativa {
  proyectos: OpcionImportacionOperativa[];
  categorias: OpcionImportacionOperativa[];
  productos: OpcionImportacionOperativa[];
}

export interface RespuestaImportacionOperativa<T> {
  estado: string;
  mensaje: string;
  respuesta: T;
}
