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
