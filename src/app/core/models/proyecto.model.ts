import { ICategorias } from './categorias.model';

export type EstadoProyecto = 'A' | 'I' | 'P'; // Activo, Inactivo, Pendiente
export type TipoProyecto = 'D' | 'M'; // Departamental, Municipal

export type ColumnKeys<T> = Array<keyof T>;

export interface IProyecto {
  idProyecto: number;
  nombre: string;
  descripcion: string;
  estado: EstadoProyecto;
  fechaInicio: string;
  fechaFin: string;
  tipoProyecto: TipoProyecto;
  contrato?: string | null;
}

export interface IProyectoAndCategoria {
  proyecto: IProyecto;
  categorias: ICategorias;
}

export interface IProyectoCategorias {
  proyecto: IProyecto;
  categorias: { idCategoria: number }[];  
}


export interface IProyectoAndCategoriaArray {
  proyecto: IProyecto;
  categorias: ICategorias[];
}

/** Filtros opcionales de la hoja de trabajo de entregas (año/mes o rango de fechas, no ambos). */
export interface FiltroHojaEntregas {
  idProyectos?: number[];
  idCategorias?: number[];
  anio?: number;
  mes?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

