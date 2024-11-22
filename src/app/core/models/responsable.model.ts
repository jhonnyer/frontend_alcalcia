type TipoIdentificacion = 'CC' | 'PA' | 'NIT' | 'TI' | 'CE';
type EstadoResponsabel = 'A' | 'I';
type PerfilUsuario = 'ADMIN' | 'RES';

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
  password: string;
  perfilUsuario: PerfilUsuario;
  estado: EstadoResponsabel;
}
