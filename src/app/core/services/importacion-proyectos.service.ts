import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import {
  ApiImportacionProyectosHistorialResponse,
  ApiImportacionProyectosResponse,
  ImportacionProyectosFilasRequest,
  ContextoImportacionInventario,
  ApiImportacionProyectosBorradorResponse,
} from '../models/importacion-proyectos.model';

@Injectable({ providedIn: 'root' })
export class ImportacionProyectosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.URL_API}/importaciones-masivas/proyectos`;

  descargarPlantilla(contexto?: ContextoImportacionInventario): Observable<Blob> {
    return this.http.get(this.endpoint('plantilla', contexto), { context: checkToken(), responseType: 'blob' });
  }

  simular(archivo: File, contexto?: ContextoImportacionInventario): Observable<ApiImportacionProyectosResponse> {
    return this.http.post<ApiImportacionProyectosResponse>(this.endpoint('simular', contexto), this.formData(archivo), {
      context: checkToken(),
    });
  }

  confirmar(archivo: File): Observable<ApiImportacionProyectosResponse> {
    return this.http.post<ApiImportacionProyectosResponse>(`${this.url}/confirmar`, this.formData(archivo), {
      context: checkToken(),
    });
  }

  simularFilas(request: ImportacionProyectosFilasRequest, contexto?: ContextoImportacionInventario): Observable<ApiImportacionProyectosResponse> {
    return this.http.post<ApiImportacionProyectosResponse>(this.endpoint('simular-filas', contexto), request, { context: checkToken() });
  }

  confirmarFilas(request: ImportacionProyectosFilasRequest, contexto?: ContextoImportacionInventario): Observable<ApiImportacionProyectosResponse> {
    return this.http.post<ApiImportacionProyectosResponse>(this.endpoint('confirmar-filas', contexto), request, { context: checkToken() });
  }

  historial(page: number, size: number, busqueda: string): Observable<ApiImportacionProyectosHistorialResponse> {
    return this.http.get<ApiImportacionProyectosHistorialResponse>(`${this.url}/historial`, {
      context: checkToken(), params: { page, size, busqueda }
    });
  }

  guardarBorrador(request: ImportacionProyectosFilasRequest, id: number | null): Observable<ApiImportacionProyectosBorradorResponse> {
    return id === null
      ? this.http.post<ApiImportacionProyectosBorradorResponse>(`${this.url}/borradores`, request, { context: checkToken() })
      : this.http.put<ApiImportacionProyectosBorradorResponse>(`${this.url}/borradores/${id}`, request, { context: checkToken() });
  }

  obtenerBorrador(id: number): Observable<ApiImportacionProyectosBorradorResponse> {
    return this.http.get<ApiImportacionProyectosBorradorResponse>(`${this.url}/borradores/${id}`, { context: checkToken() });
  }

  confirmarBorrador(id: number, versionDatos: number): Observable<ApiImportacionProyectosResponse> {
    return this.http.post<ApiImportacionProyectosResponse>(`${this.url}/borradores/${id}/confirmar`, { versionDatos }, { context: checkToken() });
  }

  private endpoint(accion: string, contexto?: ContextoImportacionInventario): string {
    return contexto
      ? `${this.url}/${contexto.idProyecto}/inventario/${accion}?actualizar=${contexto.actualizar}`
      : `${this.url}/${accion}`;
  }

  private formData(archivo: File): FormData {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return formData;
  }
}
