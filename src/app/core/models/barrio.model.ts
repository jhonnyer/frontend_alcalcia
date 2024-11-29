import { IZona } from "./zona.models";

export type ColumnKeys<T> = Array<keyof T>;

export interface IBarrio {
  "idBarrio": number;
  "idZonaFk": number;
  "nombre": string;
}
