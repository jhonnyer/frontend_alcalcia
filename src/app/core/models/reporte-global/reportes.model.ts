
/** Utilidades */
export type ISODate = string; // 'YYYY-MM-DD'
export type EstadoProyecto = 'A' | 'I'; // Activo / Inactivo
export type EstadoActa = 'P' | 'RC' | 'R' | 'A' | 'E'; // Pendiente, Rechazado, Recibido, Autorizado, Entregado

/** =============================
 *  Resumen general (cards)
 *  ============================= */
export interface ResumenGeneral {
  totalBeneficiarios: number;
  totalProyectos: number;
  totalProyectosActivos?: number;   
  totalProyectosInactivos?: number; 
  totalActas: number;
  totalProductosEntregados: number;
}

/** =========================================
 *  Población vulnerable y distribución edad
 *  ========================================= */
export interface ReportePoblacionVulnerable {
  total: number;
  discapacidad: number;
  victimas: number;
  menores: number;
  mujeres: number;
  lgbti: number;
}

export interface ReporteEdad {
  rangoEdad: string;
  total: number;
}

/** =============================
 *  Geográficos
 *  ============================= */
export interface ReporteZona {
  zona: string;
  total: number;
}

export interface ReporteBarrios {
  barrio: string;
  total: number;
}

/** =============================
 *  De gestión
 *  ============================= */
export interface ReporteProyecto {
  proyecto: string;
  totalBeneficiarios: number;
}

export interface ReporteProducto {
  producto: string;
  totalEntregado: number;
}

export interface ReporteTemporal {
  anio: number;
  mes: number;           // 1..12
  estado: string;        // ya viene con label mapeado en backend (p.ej. 'Entregado')
  total: number;
}

export interface ReporteSolicitud {
  tipoSolicitud: string;
  total: number;
}

export interface ReporteResponsable {
  responsable: string;
  totalActas: number;
}

/** =============================
 *  Entregas por proyecto
 *  ============================= */
export interface ReporteProductoProyecto {
  producto: string;
  cantidadTotal: number;
}

export interface ReporteEntregaProyecto {
  proyecto: string;
  totalEntregas: number;
  productos: ReporteProductoProyecto[];
}

/** =============================
 *  Actas por estado y proyecto
 *  ============================= */
export interface ReporteEstadoProyecto {
  estado: string;     
  totalActas: number;
}

export interface ReporteActasPorProyecto {
  proyecto: string;
  estados: ReporteEstadoProyecto[];
}

/** =============================
 *  Resumen por proyecto (detalle)
 *  ============================= */
export interface ProductoResumen {
  idProducto: number;
  nombreProducto: string;
  stock: number;
  fechaIngreso?: ISODate; 
}

export interface CategoriaResumen {
  idCategoria: number;
  nombreCategoria: string;
  totalProductos: number;
  productos: ProductoResumen[];
}

export interface BeneficiarioResumen {
  idBeneficiario: number;
  nombreCompleto: string;
  tipoDocumento: string;
  documento: string;
  sexo: string;
  barrio?: string | null;
  victimaConflicto: boolean;
  discapacidad: boolean;
  nombreNucleo?: string | null;
}

export interface ResumenProyecto {
  idProyecto: number;
  nombre: string;
  descripcion: string;
  estado: EstadoProyecto;
  tipoProyecto: string;
  fechaInicio?: ISODate | null;
  fechaFin?: ISODate | null;
  duracionDias: number;

  totalCategorias: number;
  totalProductosAsociados: number;
  totalActas: number;
  totalBeneficiarios: number;

  categorias: CategoriaResumen[];
  beneficiarios?: BeneficiarioResumen[]; 
}

/** =============================
 *  Resumen agrupado por estado
 *  ============================= */
export interface ResumenEstadoProyecto {
  totalActivos: number;
  totalInactivos: number;
  proyectosActivos: ResumenProyecto[];
  proyectosInactivos: ResumenProyecto[];
}

/** =============================
 *  Dashboard completo
 *  ============================= */
export interface DashboardReport {
  poblacionVulnerable: ReportePoblacionVulnerable;
  distribucionEdad: ReporteEdad[];

  porZona: ReporteZona[];
  porBarrio: ReporteBarrios[];

  beneficiariosPorProyecto: ReporteProyecto[];
  productosEntregados: ReporteProducto[];
  actasPorMes: ReporteTemporal[];

  solicitudesPorTipo?: ReporteSolicitud[];
  actasPorResponsable?: ReporteResponsable[];
  entregasPorProyecto?: ReporteEntregaProyecto[];
  actasPorEstadoProyecto?: ReporteActasPorProyecto[];

  proyectosResumen?: ResumenProyecto[];
  resumenEstadoProyeto?: ResumenEstadoProyecto; // respeta la key actual del backend (con el typo)
  resumenEstadoProyecto?: ResumenEstadoProyecto; 
  resumenGeneral?: ResumenGeneral;
}
