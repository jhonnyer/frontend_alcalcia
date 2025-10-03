import { INucleoUpdate } from "./nucleo.model";
type Sexo = 'M' | 'F';

export interface IBeneficiario {
  idBeneficiario: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  sexo: Sexo;
  genero: string;
  etnia: string;
  edad: number;
  victimaConflicto: boolean;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  esVivo: boolean;
  idNucleoFk: number | null;
  nombreNucleo: string;
  direccionNucleo: string;
  barrio: string;
  zona: string;
  ubicacion: string;
  discapacidad: boolean;
  certificadoDiscapacidad: boolean;
}

export interface IBeneficiarioUnique {
  idBeneficiario: number | null;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  sexo: Sexo;
  genero: string;
  etnia: string;
  edad: number;
  victimaConflicto: boolean;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  esVivo: boolean;
  discapacidad:boolean;
  certificadoDiscapacidad: boolean;
  nucleoFamiliar: INucleoUpdate;
  proyectoAsociado: INucleoUpdate;
}
