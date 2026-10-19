import type { ISecretaria } from './secretaria.model';

export interface IContextoInstitucional {
  secretaria: ISecretaria;
  parametros: IParametroNegocio;
  departamento: string | null;
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
  firmaActa: string;
  logoInstitucional?: string;
}
