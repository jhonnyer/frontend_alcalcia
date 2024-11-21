/*export interface INucleo  {
  id: string;
  zona: string;
  barrio: string;
  direccion: string;
  nombreNucleo: string;
}*/

import { IZona } from "./zona.models";
import { IBeneficiario } from "./beneficiary.models";

export interface INucleo {
  "idNucleo": number;
  "zona": IZona;
  "numeroIntegrantes": number;
  "nombreNucleo": string;
  "direccion": string;
  "beneficiarios": IBeneficiario[];
}
