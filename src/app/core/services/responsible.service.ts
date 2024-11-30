import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IResponsable } from '../models/responsable.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
// import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ResponsibleService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IResponsable[]> {
    return this.http.get<IResponsable[]>(`${this.URL}/responsables/list`, { context: checkToken() });
  }

  /**
   *
   * @param responsabelParam Puede ser el id, la cedula o el nombre como string
   * @returns Object responsable
   */
  getById(responsabelParam: string): Observable<IResponsable> {
    return this.http.get<IResponsable>(`${this.URL}/responsables/${responsabelParam}`, { context: checkToken() });
  }

  post(responsable: Partial<IResponsable>): Observable<IResponsable> {
    return this.http.post<IResponsable>(`${this.URL}/responsables`, responsable, { context: checkToken() });
  }

  update(responsable: IResponsable): Observable<IResponsable> {
    return this.http.post<IResponsable>(`${this.URL}/responsables/${responsable.idResponsable}`, responsable, { context: checkToken() });
  }

  delete(idResponsable: string): void {
    this.http.delete(`${this.URL}/responsables/${idResponsable}`, { context: checkToken() });
  }
}
