import { IBeneficiario } from "./beneficiary.models";
import { IDetalleActasProductosById } from "./detalleActaProducto.model";
import { ISelectedProduct } from "./products.model";
import { IProyecto } from "./proyecto.model";
import { IResponsable } from "./responsable.model";

type EstadoActa = 'R' | 'P' | 'A' | 'RC' | 'E'; //Enum para Recibido, Procesado, Autorizado, Rechazado, Entregado
type PrioridadActa = 'A' | 'M' | 'B';// Enum para prioridad Alta, Media, Baja

export interface IActa {
  idActa: number;
  fechaCreacion: string;
  estado: EstadoActa;
  fechaEntrega: string;
  beneficiario: IBeneficiario;
  proyecto: IProyecto;
  responsable: IResponsable;
  ubicacionEntrega: string;
  observaciones: string;
  prioridad: PrioridadActa;
  tiposSolicitud: string;
  responsableVisita: string;
}

export interface IActaById {
  idActa: number;
  fechaCreacion: string;
  estado: EstadoActa;
  fechaEntrega: string;
  beneficiarioFk: IBeneficiario;
  proyectoFk: IProyecto;
  responsableFk: IResponsable;
  ubicacionEntrega: string;
  observaciones: string;
  prioridad: PrioridadActa;
  tiposSolicitud: string;
  responsableVisita: string;
  detallesActaProductos: IDetalleActasProductosById
}

export interface ICreateActa {
  idActa: number;
  fechaCreacion: string;
  estado: EstadoActa;
  fechaEntrega: string;
  beneficiario: {idBeneficiario: number | string};
  proyecto: {idProyecto: number | string};
  responsable: {idResponsable: number | string};
  ubicacionEntrega: string;
  observaciones: string;
  prioridad: PrioridadActa;
  tiposSolicitud: string;
  responsableVisita: string;
  productos: ISelectedProduct[]
}

