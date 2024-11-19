import { IBeneficiario } from "./beneficiary.models"
import { IProyecto } from "./proyecto.model"

export interface IBeneficiarioProyecto     {
  "idBeneficiarioProyecto": 1;
  "beneficiario": IBeneficiario;
  "proyecto": IProyecto;
  "esBeneficiarioActivo": boolean;
  "fechaInicio": string;
  "fechaFin": string | null;
  "observaciones": string
}
