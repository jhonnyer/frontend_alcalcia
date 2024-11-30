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
  idProducto: number,
  nombre: string;
  descripcion: string;
  stock: number;
  fechaIngreso: string | null;
}
