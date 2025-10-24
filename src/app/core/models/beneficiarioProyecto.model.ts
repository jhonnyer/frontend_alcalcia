import { IBeneficiario } from "./beneficiary.models"
import { IProyecto, EstadoProyecto} from "./proyecto.model"

export interface IBeneficiarioProyecto     {
  idBeneficiarioProyecto: number;
  idBeneficiario: number;
  idProyecto: number;
  esBeneficiarioActivo: boolean;
  fechaInicio: string;
  fechaFin: string | null;
  observaciones: string;
  nombreProyecto: string;
  numDocumentoBeneficiario: string;
  estadoProyecto: EstadoProyecto;
  nombreNucleo?: string;
  nombreBarrio?: string;
}

