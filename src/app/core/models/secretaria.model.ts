import { IParametroNegocio } from './parametro-negocio.model';

export type TipoSecretaria = 'M' | 'D';

export interface ICreateSecretariaAdmin {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  tipoIdentificacion: 'CC' | 'PA' | 'NIT' | 'TI' | 'CE';
  numeroIdentificacion: string;
  email: string;
  telefono: string;
  usuario: string;
  password: string;
}

export interface ISecretaria {
  idSecretaria: number;
  nombre: string;
  codigo: string;
  prefijoProducto?: string;
  tipo?: TipoSecretaria;
  estado: string;
}

export interface ICreateSecretariaRequest {
  nombre: string;
  codigo: string;
  prefijoProducto: string;
  tipo: TipoSecretaria;
  estado: 'A';
  idsMunicipio?: number[];
  idsDepartamento?: number[];
  parametros: IParametroNegocio;
  admin: ICreateSecretariaAdmin;
}

export interface ICoberturaDepartamento {
  idDepartamento: number;
  nombreDepartamento: string;
  estado: string;
}

export interface ICoberturaDepartamentoRequest {
  idDepartamento: number;
  backfillBeneficiarios: boolean;
}

export interface ICoberturaMunicipio {
  idMunicipio: number;
  nombreMunicipio: string;
  estado: string;
}

export interface ICoberturaMunicipioRequest {
  idMunicipio: number;
  backfillBeneficiarios: boolean;
}

export interface IMembresiaSecretariaRequest {
  rol: string;
  idSecretariaOrigen?: number;
}

export interface IMembresiaResponsable {
  idSecretaria: number;
  nombreSecretaria: string;
  rol: 'ADMIN' | 'RESP';
  estado: string;
  fechaAsignacion: string;
}

export interface IResponsableMembresias {
  idResponsable: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  usuario: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  email: string;
  telefono: string;
  area: string;
  cargo: string;
  estado: string;
  membresias: IMembresiaResponsable[];
}
