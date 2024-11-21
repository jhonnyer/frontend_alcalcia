type Sexo = 'M' | 'F';

// BORRAR ESTA INTERFACE
export interface IBeneficiary {
  id_beneficiario: string;
  idNucleo: string;
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  sexo: string;
  genero: string;
  etnia: string;
  edad: string;
  victimaConflico: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
}

export interface IBeneficiario {
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
  idNucleoFk: number | null;
}
