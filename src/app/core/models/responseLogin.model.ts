export interface IResponseLogin {
  token: string;
  message: string;
  idUser: number;
  user: string;
  rol: string;
  estadoUser: string;
  idSecretaria: number | null;
  secretarias: ISecretariaAcceso[];
  estado: string;
}

export interface ISecretariaAcceso {
  idSecretaria: number;
  nombre: string;
  codigo: string;
  rol: string;
}
