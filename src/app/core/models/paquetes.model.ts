
import { IProducto } from "./products.model";

export interface IPaquetes {
  "idPaquete": number;
  "nombre": string;
  "descripcion": string;
  "estado": string;
}

type IDetallePaquete = {
  "idDetallePaquete": number;
  "producto": IProducto; // Es un string con el id del producto revisar
  "cantidad": number;
}
