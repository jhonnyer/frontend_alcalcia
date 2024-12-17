import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IProyecto, IProyectoAndCategoria } from '../models/proyecto.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ResponseStandar, ResponseStandarUnique } from '../models/response.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<ResponseStandar<IProyectoAndCategoria>> {
    return this.http.get<ResponseStandar<IProyectoAndCategoria>>(`${this.URL}/proyectos/list`, { context: checkToken() }).pipe(
      tap(response => {
        console.log(response)
      })
    );
  }

  getById(id: string | number): Observable<ResponseStandarUnique<IProyectoAndCategoria>> {
    return this.http.get<ResponseStandarUnique<IProyectoAndCategoria>>(`${this.URL}/proyectos/${id}`, { context: checkToken() });
  }

  getByName(name: string): Observable<ResponseStandar<IProyecto>> {
    return this.http.get<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${name}`, { context: checkToken() });
  }

  getByCategory(idCategoria: string): Observable<ResponseStandar<IProyecto>> {
    return this.http.get<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idCategoria}`, { context: checkToken() });
  }

  post(data:Partial<IProyectoAndCategoria>): Observable<ResponseStandar<IProyectoAndCategoria>> {
    return this.http.post<ResponseStandar<IProyectoAndCategoria>>(`${this.URL}/proyectos`, data, { context: checkToken() });
  }

  updateById(idProyecto: string, data:IProyecto): Observable<ResponseStandar<IProyecto>> {
    return this.http.put<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idProyecto}`, data, { context: checkToken() });
  }

  updateProjectState(idProyecto: string, state: "A" | "I"): Observable<ResponseStandar<IProyecto>>{
    return this.http.patch<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idProyecto}/estado/${state}`, { context: checkToken() });
  }

  //Asignar categoria a un proyecto
  addCategory(idProyecto: string, idCategory: string): Observable<ResponseStandar<IProyecto>>{
    return this.http.patch<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idProyecto}/estado/${idCategory}`, { context: checkToken() });
  }
}
