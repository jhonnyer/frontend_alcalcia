import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IProyecto } from '../models/proyecto.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
// import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IProyecto[]> {
    return this.http.get<IProyecto[]>(`${this.URL}/proyectos/list`);
  }

  getById(id: string): Observable<IProyecto> {
    return this.http.get<IProyecto>(`${this.URL}/proyectos/${id}`);
  }

  getByName(name: string): Observable<IProyecto> {
    return this.http.get<IProyecto>(`${this.URL}/proyectos/${name}`);
  }

  getByCategory(idCategoria: string): Observable<IProyecto> {
    return this.http.get<IProyecto>(`${this.URL}/proyectos/${idCategoria}`);
  }

  postById(data:Partial<IProyecto>): Observable<IProyecto> {
    return this.http.post<IProyecto>(`${this.URL}/proyectos}`, data);
  }

  putById(idProyecto: string, data:IProyecto) {
    this.http.put(`${this.URL}/proyectos/${idProyecto}`, data);
  }
}
