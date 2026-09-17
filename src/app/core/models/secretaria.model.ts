export interface ISecretaria {
  idSecretaria: number;
  nombre: string;
  codigo: string;
  prefijoProducto?: string;
  estado: string;
}

export interface IMembresiaSecretariaRequest {
  rol: string;
  estado: string;
}
