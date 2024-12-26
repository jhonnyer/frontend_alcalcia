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
}

export interface IProyectoAndCategoria {
  proyecto: IProyecto;
  categorias: ICategorias;
}

export interface IProyectoAndCategoriaArray {
  proyecto: IProyecto;
  categorias: ICategorias[];
}

