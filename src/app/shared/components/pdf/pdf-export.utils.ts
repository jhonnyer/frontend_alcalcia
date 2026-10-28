import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export function pdfErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) return 'El reporte tardó demasiado. Intenta reducir el período o seleccionar un proyecto.';
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (body && typeof body === 'object') {
      if ('mensaje' in body && typeof body.mensaje === 'string') return body.mensaje;
      if ('detail' in body && typeof body.detail === 'string') return body.detail;
      if ('message' in body && typeof body.message === 'string') return body.message;
    }
    return 'No se pudo descargar el PDF. Revisa la conexión y la configuración de la secretaría.';
  }
  return error instanceof Error ? error.message : 'No se pudo generar el PDF. Inténtalo nuevamente.';
}
