import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProyecto, IProyectoAndCategoriaArray, IProyectoCategorias } from '../models/proyecto.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ResponseStandar, ResponseStandarUnique } from '../models/response.model';
import { IProyectoDetallado } from '../models/proyecto-detallado.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<ResponseStandar<IProyectoAndCategoriaArray>> {
    return this.http.get<ResponseStandar<IProyectoAndCategoriaArray>>(`${this.URL}/proyectos/list`, { context: checkToken() });
  }

  getById(id: string | number): Observable<ResponseStandarUnique<IProyectoAndCategoriaArray>> {
    return this.http.get<ResponseStandarUnique<IProyectoAndCategoriaArray>>(`${this.URL}/proyectos/${id}`, { context: checkToken() });
  }

  getByName(name: string): Observable<ResponseStandar<IProyecto>> {
    return this.http.get<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${name}`, { context: checkToken() });
  }

  getByCategory(idCategoria: string): Observable<ResponseStandar<IProyecto>> {
    return this.http.get<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idCategoria}`, { context: checkToken() });
  }

  post(data:Partial<IProyectoCategorias>): Observable<ResponseStandarUnique<IProyectoCategorias>> {
    return this.http.post<ResponseStandarUnique<IProyectoCategorias>>(`${this.URL}/proyectos`, data, { context: checkToken() });
  }

  updateById(idProyecto: string, data:IProyectoCategorias): Observable<ResponseStandar<IProyectoCategorias>> {
    return this.http.put<ResponseStandar<IProyectoCategorias>>(`${this.URL}/proyectos/${idProyecto}`, data, { context: checkToken() });
  }

  updateProjectState(idProyecto: string, state: "A" | "I"): Observable<ResponseStandar<IProyecto>>{
    return this.http.patch<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idProyecto}/estado/${state}`, { context: checkToken() });
  }

  //Asignar categoria a un proyecto
  addCategory(idProyecto: string, idCategory: string): Observable<ResponseStandar<IProyecto>>{
    return this.http.patch<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idProyecto}/estado/${idCategory}`, { context: checkToken() });
  }

  delete(idProject: number): Observable<ResponseStandarUnique<IProyectoAndCategoriaArray>> {
    return this.http.delete<ResponseStandarUnique<IProyectoAndCategoriaArray>>(`${this.URL}/proyectos/${idProject}`, { context: checkToken() });
  }

  getProyectoDetallado(idProyecto: string | number): Observable<ResponseStandarUnique<IProyectoDetallado>> {
    return this.http.get<ResponseStandarUnique<IProyectoDetallado>>(
      `${this.URL}/proyectos/${idProyecto}/detallado`,
      { context: checkToken() }
    );
  }

}
