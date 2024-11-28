import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IProyecto } from '../models/proyecto.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
// import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IProyecto[]> {
    return this.http.get<IProyecto[]>(`${this.URL}/proyectos/list`, { context: checkToken() });
  }

  getById(id: string): Observable<IProyecto> {
    return this.http.get<IProyecto>(`${this.URL}/proyectos/${id}`, { context: checkToken() });
  }

  getByName(name: string): Observable<IProyecto> {
    return this.http.get<IProyecto>(`${this.URL}/proyectos/${name}`, { context: checkToken() });
  }

  getByCategory(idCategoria: string): Observable<IProyecto> {
    return this.http.get<IProyecto>(`${this.URL}/proyectos/${idCategoria}`, { context: checkToken() });
  }

  post(data:Partial<IProyecto>): Observable<IProyecto> {
    return this.http.post<IProyecto>(`${this.URL}/proyectos}`, data, { context: checkToken() });
  }

  putById(idProyecto: string, data:IProyecto) {
    this.http.put(`${this.URL}/proyectos/${idProyecto}`, data, { context: checkToken() });
  }
}
