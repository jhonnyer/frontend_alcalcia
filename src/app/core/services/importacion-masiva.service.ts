import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import {
  ActualizarImportacionRequest,
  ApiImportacionResponse,
} from '../models/importacion-masiva.model';

@Injectable({ providedIn: 'root' })
export class ImportacionMasivaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.URL_API}/importaciones-masivas/actores-sociales`;

  simular(archivo: File): Observable<ApiImportacionResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return this.http.post<ApiImportacionResponse>(`${this.url}/simular`, formData, {
      context: checkToken(),
    });
  }

  obtener(importacionId: string): Observable<ApiImportacionResponse> {
    return this.http.get<ApiImportacionResponse>(`${this.url}/${importacionId}`, {
      context: checkToken(),
    });
  }

  actualizar(importacionId: string, request: ActualizarImportacionRequest): Observable<ApiImportacionResponse> {
    return this.http.put<ApiImportacionResponse>(`${this.url}/${importacionId}`, request, {
      context: checkToken(),
    });
  }

  confirmar(importacionId: string, versionDatos: number): Observable<ApiImportacionResponse> {
    return this.http.post<ApiImportacionResponse>(
      `${this.url}/${importacionId}/confirmar?versionDatos=${versionDatos}`,
      {},
      { context: checkToken() }
    );
  }
}
