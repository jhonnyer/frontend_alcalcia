import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ApiImportacionProyectosResponse } from '../models/importacion-proyectos.model';

@Injectable({ providedIn: 'root' })
export class ImportacionProyectosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.URL_API}/importaciones-masivas/proyectos`;

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(`${this.url}/plantilla`, { context: checkToken(), responseType: 'blob' });
  }

  simular(archivo: File): Observable<ApiImportacionProyectosResponse> {
    return this.http.post<ApiImportacionProyectosResponse>(`${this.url}/simular`, this.formData(archivo), {
      context: checkToken(),
    });
  }

  confirmar(archivo: File): Observable<ApiImportacionProyectosResponse> {
    return this.http.post<ApiImportacionProyectosResponse>(`${this.url}/confirmar`, this.formData(archivo), {
      context: checkToken(),
    });
  }

  private formData(archivo: File): FormData {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return formData;
  }
}
