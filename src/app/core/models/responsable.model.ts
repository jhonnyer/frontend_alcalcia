export type TipoIdentificacion = 'CC' | 'PA' | 'NIT' | 'TI' | 'CE';
export type EstadoResponsable = 'A' | 'I';
export type PerfilUsuario = 'ADMIN' | 'RESP';

export interface IResponsable {
  idResponsable: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  cargo: string;
  area: string;
  telefono: string;
  email: string;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  usuario: string;
  password: string | null;
  perfilUsuario: PerfilUsuario;
  estado: EstadoResponsable;
}
