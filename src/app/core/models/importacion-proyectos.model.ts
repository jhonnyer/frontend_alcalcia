import { ImportacionError } from './importacion-masiva.model';
import { PaginatedResponse } from './pagination.model';

export interface ImportacionProyectoFila {
  numeroFila: number | null;
  proyecto: string | null;
  descripcionProyecto: string | null;
  tipoProyecto: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  contrato?: string | null;
  categoria: string | null;
  descripcionCategoria?: string | null;
  idCategoria?: number | null;
  idProducto?: number | null;
  referenciaCategoria?: string | null;
  referenciaProducto?: string | null;
  producto: string | null;
  descripcionProducto: string | null;
  stock: string | null;
  stockActual?: number | null;
  cantidadAgregar?: string | null;
}

export interface ContextoImportacionInventario {
  idProyecto: number;
  actualizar: boolean;
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
  versionDatos?: number | null;
  tipoOperacion?: TipoCargaProyecto;
  idProyecto?: number;
}

export type TipoCargaProyecto = 'PROYECTOS' | 'CREAR_INVENTARIO' | 'ACTUALIZAR_INVENTARIO';

export interface ImportacionProyectosBorrador {
  idImportacion: number;
  versionDatos: number;
  tipoOperacion: TipoCargaProyecto;
  idProyecto: number | null;
  nombreArchivo: string;
  resultado: ImportacionProyectosResultado;
}

export interface ApiImportacionProyectosBorradorResponse {
  respuesta: ImportacionProyectosBorrador;
  mensaje: string;
  estado: string;
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
  fechaConfirmacion: string | null;
  fechaActualizacion: string;
  tipoOperacion: TipoCargaProyecto;
  idProyecto: number | null;
  totalFilas: number;
  totalProyectos: number;
  totalCategorias: number;
  totalProductos: number;
  proyectosCreados: string | null;
}

export interface ApiImportacionProyectosHistorialResponse {
  respuesta: PaginatedResponse<ImportacionProyectosHistorica>;
  mensaje: string;
  estado: string;
}
