import { inject, Injectable } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { IProyecto, IProyectoAndCategoriaArray, IProyectoCategorias, FiltroHojaEntregas } from '../models/proyecto.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    return this.http.get<ResponseStandar<IProyectoAndCategoriaArray>>(`${this.URL}/proyectos/list`, { context: checkToken() }).pipe(
      timeout(45000),
      map(response => {
        if (!response || response.estado !== 'exito') {
          throw new Error(response?.mensaje || 'No se pudo obtener la lista de proyectos');
        }
        return {
          ...response,
          respuesta: (response.respuesta ?? []).map(item => ({ ...item, categorias: item.categorias ?? [] }))
        };
      })
    );
  }

  getById(id: string | number): Observable<ResponseStandarUnique<IProyectoAndCategoriaArray>> {
    return this.http.get<ResponseStandarUnique<IProyectoAndCategoriaArray>>(`${this.URL}/proyectos/${id}`, { context: checkToken() });
  }

  getByName(name: string): Observable<ResponseStandar<IProyecto>> {
    return this.http.get<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/nombre/${encodeURIComponent(name)}`, { context: checkToken() });
  }

  getByCategory(idCategoria: string): Observable<ResponseStandar<IProyecto>> {
    return this.http.get<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/categoria/${idCategoria}`, { context: checkToken() });
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
    return this.http.patch<ResponseStandar<IProyecto>>(`${this.URL}/proyectos/${idProyecto}/categoria/${idCategory}`, {}, { context: checkToken() });
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

  descargarHojaEntregas(filtro: FiltroHojaEntregas): Observable<Blob> {
    let params = new HttpParams();
    filtro.idProyectos?.forEach(id => params = params.append('idProyectos', id));
    filtro.idCategorias?.forEach(id => params = params.append('idCategorias', id));
    if (filtro.anio) params = params.set('anio', filtro.anio);
    if (filtro.mes) params = params.set('mes', filtro.mes);
    if (filtro.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
    if (filtro.fechaFin) params = params.set('fechaFin', filtro.fechaFin);
    return this.http.get(`${this.URL}/reportes/entregas-excel`, {
      params,
      responseType: 'blob',
      context: checkToken()
    });
  }

}
