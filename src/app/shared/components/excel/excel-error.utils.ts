import { HttpErrorResponse } from '@angular/common/http';

export async function mensajeErrorReporteExcel(error: unknown): Promise<string> {
  if (!(error instanceof HttpErrorResponse)) return error instanceof Error ? error.message : 'No se pudo generar el reporte.';
  let body: unknown = error.error;
  if (body instanceof Blob) {
    const texto = await body.text();
    try {
      body = JSON.parse(texto);
    } catch (parseError) {
      console.warn('La respuesta de error del reporte no contiene JSON:', parseError);
      return 'No se pudo generar el reporte. Revisa la conexión e inténtalo nuevamente.';
    }
  }
  if (body && typeof body === 'object' && 'mensaje' in body && typeof body.mensaje === 'string') return body.mensaje;
  return 'No se pudo generar el reporte. Revisa la conexión e inténtalo nuevamente.';
}
