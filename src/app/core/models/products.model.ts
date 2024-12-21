export type ColumnKeys<T> = Array<keyof T>;

export interface Products {
  codigo: string;
  descripcion: string;
  categoria: string;
  unidad_medida: string;
  proveedor: string;
  fecha_ingreso: string;
  precio_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: string;
}

export interface IProducto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  stock: number;
  fechaIngreso: string | null;
}

export interface IProductoFk {
  idProductoFk: number;
  nombreProducto: string;
  descripcion: string;
  stock: number;
  fechaIngreso: null | string;
  cantidad: number;
}

export interface ISelectedProduct {
  idProductoFk: number;
  cantidad: number;
}

export interface IProductoAndProyecto {
  idProyecto: number;
  idCategoria: number;
  productos: Array<Omit<IProductoFk, 'idProductoFk' | 'cantidad'>>;
}
