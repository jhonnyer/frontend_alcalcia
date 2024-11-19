import { IZona } from "./zona.models";

export type ColumnKeys<T> = Array<keyof T>;

export interface IBarrio {
  "idBarrio": number;
  "zona": IZona;
  "nombre": string;
}
