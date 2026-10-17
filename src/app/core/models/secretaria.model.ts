export interface ISecretaria {
  idSecretaria: number;
  nombre: string;
  codigo: string;
  prefijoProducto?: string;
  estado: string;
}

export interface ICreateSecretariaRequest {
  nombre: string;
  codigo: string;
  prefijoProducto: string;
  estado: 'A';
  idsMunicipio?: number[];
  idsDepartamento?: number[];
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
  estado: string;
}
