import { EstadoProyecto} from "./proyecto.model"

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
  nombreCompleto: string;
  estadoProyecto: EstadoProyecto;
  nombreNucleo?: string;
  nombreBarrio?: string;
}

