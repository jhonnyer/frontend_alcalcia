import { ImportacionError } from './importacion-masiva.model';

export interface ImportacionProyectoFila {
  numeroFila: number | null;
  proyecto: string | null;
  descripcionProyecto: string | null;
  tipoProyecto: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  contrato?: string | null;
  categoria: string | null;
  producto: string | null;
  descripcionProducto: string | null;
  stock: string | null;
}

export interface ImportacionProyectosResultado {
  confirmada: boolean;
  totalFilas: number;
  totalProyectos: number;
  totalCategorias: number;
  totalProductos: number;
  filas: ImportacionProyectoFila[];
  errores: ImportacionError[];
}

export interface ImportacionProyectosFilasRequest {
  nombreArchivo: string;
  filas: ImportacionProyectoFila[];
}

export interface ApiImportacionProyectosResponse {
  respuesta: ImportacionProyectosResultado;
  mensaje: string;
  estado: string;
}

export interface ImportacionProyectosHistorica {
  idImportacion: number;
  nombreArchivo: string;
  usuario: string;
  estado: string;
  fechaConfirmacion: string;
  totalFilas: number;
  totalProyectos: number;
  totalCategorias: number;
  totalProductos: number;
  proyectosCreados: string | null;
}

export interface ApiImportacionProyectosHistorialResponse {
  respuesta: ImportacionProyectosHistorica[];
  mensaje: string;
  estado: string;
}
