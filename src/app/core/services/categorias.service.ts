import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ICategorias } from '../models/categorias.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private http = inject(HttpClient);

  getAll(): Observable<ICategorias[]>{
    return this.http.get<ICategorias[]>(`${environment.URL_API}/categorias/list`, { context: checkToken() });
  }

  getById(categoriaId: string): Observable<ICategorias>{
    return this.http.get<ICategorias>(`${environment.URL_API}/categorias/${categoriaId}`, { context: checkToken() });
  }

  /**
   * @param categoriaId string id de la categoría o id del proyecto
   * @returns ICategorias object
   */
  getByCategoryAndProject(categoriaId: string, proyectoId: string): Observable<ICategorias>{
    return this.http.get<ICategorias>(`${environment.URL_API}/categorias/${categoriaId}/proyectos/${proyectoId}`, { context: checkToken() });
  }

  post(categoria: Partial<ICategorias>): Observable<ICategorias>{
    return this.http.post<ICategorias>(`${environment.URL_API}/categorias`, categoria ,{ context: checkToken() });
  }

  updateById(idCategoria: string, categoria: Partial<ICategorias>): Observable<ICategorias>{
    return this.http.put<ICategorias>(`${environment.URL_API}/categorias/${idCategoria}`, categoria, { context: checkToken() });
  }

  delete(idCategoria: string): Observable<ICategorias>{
    return this.http.delete<ICategorias>(`${environment.URL_API}/categorias/${idCategoria}`, { context: checkToken() });
  }

}
