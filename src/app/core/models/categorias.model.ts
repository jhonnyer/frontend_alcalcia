import { IProductoFk } from './products.model';

export interface ICategorias {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  productos?: Array<IProductoFk> | null;
  idProyectoFk?: number;
}
