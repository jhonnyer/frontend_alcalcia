import { IActa } from "./acta.model";
import { IProducto } from "./products.model";
import { IProductoFk } from "./products.model";
import { IPaquete, IPaqueteFk } from "./paquetes.model";

export interface IDetalleActaProducto {
  "idDetalleActaProducto": number;
  "acta": IActa;
  "producto": IProducto;
  "paquete": string | null;
  "cantidad": number;
}

export interface IDetalleActasProductosById {
  idDetalleActaProducto: number;
  idActaFk: number;
  productos: null | IProductoFk;
  paquetes: null | IPaqueteFk;
}
