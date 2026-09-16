import { inject, Injectable } from '@angular/core';
import { INucleoUpdate } from '../models/nucleo.model';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PaginatedResponse } from '../models/pagination.model';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { NucleoDetallado } from '../models/nucleo-detallado.model';

@Injectable({
  providedIn: 'root'
})
export class NucleoService {
  private URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(page: number): Observable<PaginatedResponse<INucleoUpdate>> {
    return this.http.get<PaginatedResponse<INucleoUpdate>>(`${this.URL}/nucleosFamiliares/list?page=${page}`, { context: checkToken() });
  }

  getSimpleAll(): Observable<INucleoUpdate[]> {
    return this.http.get<INucleoUpdate[]>(`${this.URL}/nucleosFamiliares/listar`, { context: checkToken() });
  }

  getById(id: string): Observable<INucleoUpdate> {
    return this.http.get<INucleoUpdate>(`${this.URL}/nucleosFamiliares/${id}`, { context: checkToken() }).pipe(
      tap(item => {
        item.beneficiarios = item.beneficiarios ?? [];
        item.beneficiarios.forEach(beneficiario => {
          beneficiario.fechaNacimiento = this.formatDate(beneficiario.fechaNacimiento);
        });
      })
    );
  }

  post(data: INucleoUpdate): Observable<{ estado: string; mensaje: string; respuesta: INucleoUpdate }> {
    return this.http.post<{ estado: string; mensaje: string; respuesta: INucleoUpdate }>(
      `${this.URL}/nucleosFamiliares`,
      data,
      { context: checkToken() }
    );
  }

  updateById(nucleoID: string, itemNucleo: INucleoUpdate):Observable<INucleoUpdate> {
    return this.http.put<INucleoUpdate>(`${this.URL}/nucleosFamiliares/${nucleoID}`, itemNucleo, { context: checkToken() });
  }

  deleteById(id: string) {
    return this.http.delete(`${this.URL}/nucleosFamiliares/${id}`, { context: checkToken() });
  }

  obtenerDetalleNucleo(idNucleo: number): Observable<{ respuesta: NucleoDetallado }> {
    return this.http.get<{ respuesta: NucleoDetallado }>(`${this.URL}/nucleosFamiliares/${idNucleo}/detallado`);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }
}
