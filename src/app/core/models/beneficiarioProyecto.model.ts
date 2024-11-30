import { IBeneficiario } from "./beneficiary.models"
import { IProyecto } from "./proyecto.model"

export interface IBeneficiarioProyecto     {
  idBeneficiarioProyecto: number;
  idBeneficiario: number;
  idProyecto: number;
  esBeneficiarioActivo: boolean;
  fechaInicio: string;
  fechaFin: string | null;
  observaciones: string;
}


