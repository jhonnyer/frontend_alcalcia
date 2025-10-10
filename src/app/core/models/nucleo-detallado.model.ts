export interface NucleoDetallado {
  idNucleo: number;
  nombreNucleo: string;
  direccion: string;
  nombreZona: string;
  nombreBarrio: string;
  numeroIntegrantes: number;
  beneficiariosNucleo: Beneficiario[];
  beneficiariosProyecto: BeneficiarioProyecto[];
  actas: ActaPdf[];
  parametros?: any;
}

export interface Beneficiario {
  idBeneficiario: number;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  sexo?: string;
  genero?: string;
  etnia?: string;
  edad?: number;
  tipoDocumento?: string;
  numeroDocumento: string;
  email?: string;
  telefono?: string;
  discapacidad?: boolean;
  esVivo?: boolean;
  victimaConflicto?:boolean
}

export interface BeneficiarioProyecto {
  idBeneficiarioProyecto: number;
  idProyecto: number;
  esBeneficiarioActivo: boolean;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  nombreProyecto: string;
  estadoProyecto: string;
  nombreCompleto: string;
  numDocumentoBeneficiario: string;
}

export interface ActaPdf {
  idActa: number;
  fechaCreacion: string;
  estado: string;
  fechaEntrega?: string;
  beneficiario: Beneficiario;
  proyecto: Proyecto;
  responsable: Responsable;
  observaciones: string;
  ubicacionEntrega: string;
  prioridad: string;
  tipoSolicitud: string;
  responsableVisita: string;
  detallesActaProductos: DetalleActaProducto[];
}

export interface Proyecto {
  idProyecto: number;
  nombre: string;
  descripcion: string;
  estado: string;
  tipoProyecto: string;
}

export interface Responsable {
  idResponsable: number;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  cargo: string;
  area: string;
  telefono: string;
  email: string;
  numeroIdentificacion: string;
  tipoIdentificacion: string;
  perfilUsuario: string;
  estado: string;
}

export interface DetalleActaProducto {
  idDetalleActaProducto: number;
  idActaFk: number;
  productos: ProductoCantidad[];
  paquetes: PaqueteCantidad[];
}

export interface ProductoCantidad {
  idProductoFk: number;
  nombreProducto: string;
  descripcion: string;
  stock: number;
  fechaIngreso: string;
  cantidad: number;
}

export interface PaqueteCantidad {
  idPaqueteFk: number;
  nombrePaquete: string;
  descripcion: string;
  estado: string;
  stock: number;
  cantidad: number;
}
