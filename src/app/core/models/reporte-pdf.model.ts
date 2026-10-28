import { ReporteFiltroRequest } from '../services/reportes.service';

export interface FiltroReportePdf extends ReporteFiltroRequest {
  rangoEdad?: string;
  idsVinculaciones?: number[];
  tipoSolicitud?: string;
  fechaActa?: 'CREACION' | 'ENTREGA';
}

export interface OpcionesFiltroPdf {
  titulo: string;
  filtro: FiltroReportePdf;
  proyectoFijo?: number;
  actor?: boolean;
  vinculaciones?: boolean;
}
