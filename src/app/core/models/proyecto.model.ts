type EstadoProyecto = 'A' | 'I' | 'P';
type TipoProyecto = 'D' | 'M';

export type ColumnKeys<T> = Array<keyof T>;

export interface IProyecto{
  "idProyecto": number;
  "nombre": string;
  "descripcion": string;
  "estado": EstadoProyecto;
  "fechaInicio": string;
  "fechaFin": string;
  "tipoProyecto": TipoProyecto;
}
