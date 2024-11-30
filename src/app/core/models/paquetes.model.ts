
import { IProducto } from "./products.model";

export interface IPaquete {
  idPaquete: number;
  nombre: string;
  descripcion: string;
  estado: string;
  stock: 5,
  detallesPaquete: IDetallePaquete[];
}

type IDetallePaquete = {
  idDetallePaquete: number;
  producto: IProducto; // Es un string con el id del producto revisar
  cantidad: number;
}
