
import { IProducto } from "./products.model";

export interface IPaquete {
  idPaquete: number;
  nombre: string;
  descripcion: string;
  estado: string;
  stock: 5,
  detallesPaquete: IDetallePaquete[];
}

export interface IPaqueteFk {
  idPaqueteFk: number;
  cantidad: number;
  nombrePaquete: string;
  descripcion: string;
  estado: null,
  stock: number;
}

type IDetallePaquete = {
  idDetallePaquete: number;
  producto: IProducto; // Es un string con el id del producto revisar
  cantidad: number;
}
