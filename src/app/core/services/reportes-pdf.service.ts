import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { TokenService } from './token.service';
import { MatDialog } from '@angular/material/dialog';
import { FiltroReportePdf, OpcionesFiltroPdf } from '../models/reporte-pdf.model';
import { PdfFiltrosDialogComponent } from '../../shared/components/pdf/pdf-filtros-dialog.component';

@Injectable({ providedIn: 'root' })
export class ReportesPdfService {
  private readonly http = inject(HttpClient);
  private readonly token = inject(TokenService);
  private readonly dialog = inject(MatDialog);
  private readonly url = `${environment.URL_API}/reportes/pdf`;

  dashboard(filtro: FiltroReportePdf = {}): Promise<void> {
    return this.descargar('dashboard', { titulo: 'Filtros del informe general', filtro }, 'Informe_general.pdf');
  }

  proyecto(id: number): Promise<void> {
    return this.descargar(`proyecto/${id}`, { titulo: 'Filtros del informe del proyecto', filtro: {}, proyectoFijo: id }, 'Reporte_proyecto.pdf');
  }

  vinculaciones(idsVinculaciones: number[]): Promise<void> {
    return this.descargar('vinculaciones', { titulo: 'Filtros de beneficiarios por proyecto', filtro: { idsVinculaciones }, vinculaciones: true }, 'Beneficiarios_por_proyecto.pdf');
  }

  actor(id: number, filtro: FiltroReportePdf = {}, dashboard = false): Promise<void> {
    return this.descargar(`actor/${id}${dashboard ? '/dashboard' : ''}`, { titulo: 'Filtros del informe del actor social', filtro, actor: true },
      dashboard ? 'Dashboard_actor_social.pdf' : 'Reporte_actor_social.pdf');
  }

  private async descargar(ruta: string, opciones: OpcionesFiltroPdf, nombre: string): Promise<void> {
    const tokenInicial = this.token.getToken();
    const secretariaInicial = this.token.getActiveSecretaryId();
    try {
      const filtro = await firstValueFrom(this.dialog.open<PdfFiltrosDialogComponent, OpcionesFiltroPdf, FiltroReportePdf>(
        PdfFiltrosDialogComponent, { data: opciones, width: '780px', maxWidth: '96vw', maxHeight: '92vh' }).afterClosed());
      if (!filtro) return;
      if (tokenInicial !== this.token.getToken() || secretariaInicial !== this.token.getActiveSecretaryId()) {
        throw new Error('La sesión o secretaría activa cambió. Cierra los filtros e inicia nuevamente la descarga.');
      }
      const blob = await firstValueFrom(this.http.post(`${this.url}/${ruta}`, filtro,
        { responseType: 'blob', context: checkToken() }).pipe(timeout(120000)));
      if (tokenInicial !== this.token.getToken() || secretariaInicial !== this.token.getActiveSecretaryId()) {
        throw new Error('La sesión o secretaría activa cambió durante la exportación. Vuelve a generar el reporte.');
      }
      if (!blob.size || blob.type !== 'application/pdf') throw new Error('El servidor no devolvió un PDF válido.');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombre;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
        const text = await error.error.text();
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch (parseError) {
          console.warn('La respuesta de error PDF no contiene JSON:', parseError);
          throw new Error('No se pudo generar el PDF. Revisa la conexión e inténtalo nuevamente.');
        }
        if (body && typeof body === 'object' && 'mensaje' in body && typeof body.mensaje === 'string') {
          throw new Error(body.mensaje);
        }
      }
      throw error;
    }
  }
}
