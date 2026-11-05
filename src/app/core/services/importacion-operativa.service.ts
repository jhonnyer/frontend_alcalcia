import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import {
  CatalogosImportacionOperativa, FilaImportacionOperativa, RespuestaImportacionOperativa,
  ResultadoImportacionOperativa, ResumenImportacionOperativa, TipoImportacionOperativa,
} from '../models/importacion-operativa.model';

@Injectable({ providedIn: 'root' })
export class ImportacionOperativaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.URL_API}/importaciones-masivas/operativas`;

  plantilla(tipo: TipoImportacionOperativa) {
    return this.http.get(`${this.url}/plantilla`, { params: { tipo }, context: checkToken(), responseType: 'blob' });
  }

  catalogos() {
    return this.http.get<CatalogosImportacionOperativa>(`${this.url}/catalogos`, { context: checkToken() });
  }

  historial(tipo: TipoImportacionOperativa) {
    return this.http.get<RespuestaImportacionOperativa<ResumenImportacionOperativa[]>>(
      `${this.url}/${tipo}/historial`, { context: checkToken() });
  }

  obtener(tipo: TipoImportacionOperativa, id: string) {
    return this.http.get<RespuestaImportacionOperativa<ResultadoImportacionOperativa>>(
      `${this.url}/${tipo}/${id}`, { context: checkToken() });
  }

  simular(tipo: TipoImportacionOperativa, archivo: File, idResponsable: number | null) {
    const form = new FormData();
    form.append('archivo', archivo, archivo.name);
    if (tipo === 'ACTAS' && idResponsable !== null) form.append('idResponsable', String(idResponsable));
    return this.http.post<RespuestaImportacionOperativa<ResultadoImportacionOperativa>>(
      `${this.url}/${tipo}/simular`, form, { context: checkToken() });
  }

  actualizar(tipo: TipoImportacionOperativa, resultado: ResultadoImportacionOperativa,
    filas: FilaImportacionOperativa[], idResponsable: number | null) {
    return this.http.put<RespuestaImportacionOperativa<ResultadoImportacionOperativa>>(
      `${this.url}/${tipo}/${resultado.id}`,
      { versionDatos: resultado.versionDatos, filas, idResponsable }, { context: checkToken() });
  }

  confirmar(tipo: TipoImportacionOperativa, resultado: ResultadoImportacionOperativa) {
    return this.http.post<RespuestaImportacionOperativa<ResultadoImportacionOperativa>>(
      `${this.url}/${tipo}/${resultado.id}/confirmar`, {},
      { params: { versionDatos: resultado.versionDatos }, context: checkToken() });
  }

  eliminar(tipo: TipoImportacionOperativa, id: string) {
    return this.http.delete<RespuestaImportacionOperativa<null>>(
      `${this.url}/${tipo}/${id}`, { context: checkToken() });
  }
}
