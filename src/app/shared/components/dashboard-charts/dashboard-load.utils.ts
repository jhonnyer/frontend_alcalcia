import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export function dashboardLoadError(error: unknown): string {
  const message = error instanceof TimeoutError
    ? 'La consulta tardó más de 15 segundos. La conexión o el servidor pueden estar lentos.'
    : error instanceof HttpErrorResponse && error.status === 0
      ? 'No se pudo conectar con el servidor. Revisa tu señal o prueba con Wi-Fi.'
      : 'No se pudieron cargar las estadísticas.';
  return `${message} Puedes reintentar o continuar en otro módulo.`;
}
