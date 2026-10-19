import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';

export interface PerfilEditable {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  area: string;
  cargo: string;
  email: string;
  telefono: string;
}

export interface Perfil extends PerfilEditable {
  usuario: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  area: string;
  cargo: string;
}

export interface CambioPassword {
  passwordActual: string;
  passwordNueva: string;
  confirmarPassword: string;
}

export function perfilErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (body && typeof body === 'object' && 'mensaje' in body && typeof body.mensaje === 'string') {
      return body.mensaje;
    }
    return 'La solicitud falló. Revisa tu conexión y vuelve a intentarlo.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.URL_API}/perfil`;

  get() {
    return this.http.get<Perfil>(this.url, { context: checkToken() });
  }

  update(payload: PerfilEditable) {
    return this.http.put<Perfil>(this.url, payload, { context: checkToken() });
  }

  changePassword(payload: CambioPassword) {
    return this.http.put<void>(`${this.url}/password`, payload, { context: checkToken() });
  }
}
