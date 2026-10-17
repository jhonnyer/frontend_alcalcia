export type TipoIdentificacion = 'CC' | 'PA' | 'NIT' | 'TI' | 'CE';
export type EstadoResponsable = 'A' | 'I';
export type PerfilUsuario = 'ADMIN' | 'RESP' | 'SUPERADMIN';

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
  password?: string | null;
  perfilUsuario: PerfilUsuario;
  estado: EstadoResponsable;
}

export interface ISoporteSuperAdmin {
  idResponsable: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  usuario: string;
  email: string;
  telefono: string;
  cargo: string;
  estado: EstadoResponsable;
}
