import { IProyecto } from "./proyecto.model";
import { ICategorias } from "./categorias.model";
import { IActaById } from "./acta.model";
import { IBeneficiarioProyecto } from "./beneficiarioProyecto.model";
import { IProductoFk } from "./products.model";
import { IPaqueteFk } from "./paquetes.model";

export interface IParametrosNegocio {
  nombreAlcalde: string;
  nombreAlcaldia: String;
  correoAlcaldia: String;
  nombreSecretaria: string;
  direccionAlcaldia: string;
  codigoPostal: string;
  firmaActa: string;
  contactoAlcaldia: String;
}

export interface IProyectoDetallado {
  proyecto: IProyecto;
  categorias: ICategorias[];
  beneficiarios: IBeneficiarioProyecto[];
  actas: IActaDetallada[];
  parametros: IParametrosNegocio;
}

export interface IDetalleActaPdf {
  idDetalleActaProducto: number | null;
  idActaFk: number | null;
  productos: IProductoFk[];
  paquetes: IPaqueteFk[];
}

export interface IActaDetallada extends Omit<IActaById, 'detallesActaProductos'> {
  detallesActaProductos: IDetalleActaPdf[];
}
