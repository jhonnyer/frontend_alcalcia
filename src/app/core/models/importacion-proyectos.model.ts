import { ImportacionError } from './importacion-masiva.model';

export interface ImportacionProyectoFila {
  numeroFila: number;
  proyecto: string | null;
  descripcionProyecto: string | null;
  tipoProyecto: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
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

export interface ApiImportacionProyectosResponse {
  respuesta: ImportacionProyectosResultado;
  mensaje: string;
  estado: string;
}
