import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IProducto } from '../models/products.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
// import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IProducto[]> {
    return this.http.get<IProducto[]>(`${this.URL}/productos/list`);
  }

  getById(idProducto: string): Observable<IProducto[]> {
    return this.http.get<IProducto[]>(`${this.URL}/productos/${idProducto}`);
  }

  post(data:Partial<IProducto>): Observable<IProducto> {
    return this.http.post<IProducto>(`${this.URL}/productos}`, data);
  }

  putById(idProducto: string, data:IProducto) {
    this.http.put(`${this.URL}/productos/${idProducto}`, data);
  }

  delete(idProducto: string) {
    this.http.delete(`${this.URL}/productos/${idProducto}`);
  }

}
