import { IProducto } from "./products.model";

 export interface IDetallePaquete {
  "idDetallePaquete": number;
  "producto": IProducto;
  "cantidad": number;
}
