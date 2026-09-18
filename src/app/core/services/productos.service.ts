import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IProducto, IProductoAndProyecto } from '../models/products.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
// import { PaginatedResponse } from '../models/pagination.model';
import { ResponseStandar, ResponseStandarUnique } from '../models/response.model';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IProducto[]> {
    return this.http.get<IProducto[]>(`${this.URL}/productos/list`, { context: checkToken() });
  }

  getByProjectCategory(idProyecto: number, idCategoria: number): Observable<IProducto[]> {
    return this.http.get<IProducto[]>(
      `${this.URL}/productos/proyecto/${idProyecto}/categoria/${idCategoria}`,
      { context: checkToken() }
    );
  }

  getById(idProducto: string): Observable<IProducto> {
    return this.http.get<IProducto>(`${this.URL}/productos/${idProducto}`, { context: checkToken() });
  }

  post(data:Partial<IProductoAndProyecto>): Observable<ResponseStandarUnique<string | null>> {
    return this.http.post<ResponseStandarUnique<string | null>>(`${this.URL}/productos`, data, { context: checkToken() });
  }

  updateById(idProducto: string, data:Partial<IProducto>): Observable<ResponseStandarUnique<IProducto>> {
    return this.http.put<ResponseStandarUnique<IProducto>>(`${this.URL}/productos/${idProducto}`, data, { context: checkToken() });
  }

  delete(idProducto: string): Observable<void> {
    return this.http.delete<void>(`${this.URL}/productos/${idProducto}`, { context: checkToken() });
  }

}
