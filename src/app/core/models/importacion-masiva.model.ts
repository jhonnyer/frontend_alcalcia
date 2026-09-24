export interface ImportacionFila {
  numeroFila?: number;
  actorRef: string;
  nombreNucleo: string;
  direccion: string;
  idZona: number | null;
  idBarrio: number | null;
  beneficiarioPrimerNombre: string;
  beneficiarioSegundoNombre?: string | null;
  beneficiarioPrimerApellido: string;
  beneficiarioSegundoApellido?: string | null;
  sexo: string;
  genero?: string | null;
  etnia?: string | null;
  edadCalculada?: number | null;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  victimaConflicto?: string | null;
  esVivo?: string | null;
  discapacidad?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface ImportacionError {
  numeroFila: number;
  actorRef?: string | null;
  campo: string;
  mensaje: string;
}

export interface ImportacionResultado {
  importacionId: string;
  estado: string;
  versionDatos: number;
  totalFilas: number;
  totalGrupos: number;
  totalGruposConfirmados: number;
  totalGruposRechazados: number;
  totalBeneficiariosCreados: number;
  filas: ImportacionFila[];
  errores: ImportacionError[];
}

export interface ApiImportacionResponse {
  respuesta: ImportacionResultado;
  mensaje: string;
  estado: string;
}

export interface ImportacionPendiente {
  importacionId: string;
  nombreArchivo: string;
  estado: string;
  versionDatos: number;
  totalFilas: number;
  totalGrupos: number;
  totalGruposRechazados: number;
  fechaCreacion: string;
  fechaExpiracion: string;
}

export interface ApiImportacionesPendientesResponse {
  respuesta: ImportacionPendiente[];
  mensaje: string;
  estado: string;
}

export interface ActualizarImportacionRequest {
  versionDatos: number;
  filas: ImportacionFila[];
}
