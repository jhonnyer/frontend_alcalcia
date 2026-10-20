import type { ISecretaria } from './secretaria.model';

export interface IContextoInstitucional {
  secretaria: ISecretaria;
  parametros: IParametroNegocio;
  departamento: string | null;
}

export interface IFormatoActa {
  encabezado: string;
  codigoFormato: string;
  versionFormato: string;
  fechaAprobacionFormato: string | null;
  firmaActa?: string;
  [campo: string]: unknown;
}

export interface IConfiguracionDocumentos {
  acta?: IFormatoActa;
  [documento: string]: unknown;
}

export interface IParametroNegocio {
  idParametro?: number;
  idSecretariaFk?: number;
  nombreAlcalde: string;
  nombreAlcaldia: string;
  nombreSecretaria: string;
  correoAlcaldia: string;
  direccionAlcaldia: string;
  codigoPostal: string;
  contactoAlcaldia: string;
  logoInstitucional?: string;
  configuracionDocumentos?: IConfiguracionDocumentos | null;
}
