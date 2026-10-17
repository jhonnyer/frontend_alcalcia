import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { IParametroNegocio } from '../models/parametro-negocio.model';

@Injectable({ providedIn: 'root' })
export class ParametroNegocioService {
  private readonly URL = environment.URL_API;
  private readonly http = inject(HttpClient);

  getActive(): Observable<IParametroNegocio> {
    return this.http.get<IParametroNegocio>(`${this.URL}/parametros-negocio/activa`, { context: checkToken() });
  }

  upsertActive(payload: IParametroNegocio): Observable<IParametroNegocio> {
    return this.http.put<IParametroNegocio>(`${this.URL}/parametros-negocio/activa`, payload, { context: checkToken() });
  }
}
