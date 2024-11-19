import { IActa } from "./acta.model";
import { IProducto } from "./products.model";
export interface IDetalleActaProducto {
  "idDetalleActaProducto": number;
  "acta": IActa;
  "producto": IProducto;
  "paquete": string | null;
  "cantidad": number;
}
