import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { IMunicipio } from '../models/municipio.model';

@Injectable({
  providedIn: 'root'
})
export class MunicipioService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<IMunicipio[]> {
    return this.http.get<IMunicipio[]>(`${environment.URL_API}/municipios/list`, { context: checkToken() });
  }
}
