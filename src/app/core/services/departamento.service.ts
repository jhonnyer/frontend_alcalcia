import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { IDepartamento } from '../models/departamento.model';

@Injectable({
  providedIn: 'root'
})
export class DepartamentoService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<IDepartamento[]> {
    return this.http.get<IDepartamento[]>(`${environment.URL_API}/departamentos/list`, { context: checkToken() });
  }
}
