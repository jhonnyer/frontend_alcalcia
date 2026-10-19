import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { IContextoInstitucional, IParametroNegocio } from '../models/parametro-negocio.model';

@Injectable({ providedIn: 'root' })
export class ParametroNegocioService {
  private readonly URL = environment.URL_API;
  private readonly http = inject(HttpClient);
  private readonly changes = new Subject<number>();
  readonly changes$ = this.changes.asObservable();

  getActive(): Observable<IParametroNegocio> {
    return this.http.get<IParametroNegocio>(`${this.URL}/parametros-negocio/activa`, { context: checkToken() });
  }

  getContext(): Observable<IContextoInstitucional> {
    return this.http.get<IContextoInstitucional>(`${this.URL}/parametros-negocio/contexto-institucional`, { context: checkToken() });
  }

  upsertActive(payload: IParametroNegocio): Observable<IParametroNegocio> {
    return this.http.put<IParametroNegocio>(`${this.URL}/parametros-negocio/activa`, payload, { context: checkToken() }).pipe(
      tap(parametros => {
        if (parametros.idSecretariaFk != null) this.changes.next(parametros.idSecretariaFk);
      }),
    );
  }
}
