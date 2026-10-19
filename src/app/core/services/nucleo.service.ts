import { inject, Injectable } from '@angular/core';
import { TableColumnFilters, withColumnFilters } from '../models/table-column-filters';
import { INucleoUpdate } from '../models/nucleo.model';
import { environment } from '../../../environments/environment';
import { Observable, map, tap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../models/pagination.model';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { NucleoDetallado } from '../models/nucleo-detallado.model';

interface SpringPageDto<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface NucleoPagedFilters extends TableColumnFilters {
  nombreZona?: string;
  idZonaFk?: number;
  idBarrioFk?: number;
  busqueda?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NucleoService {
  private URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(page: number, size?: number, filters: NucleoPagedFilters = {}): Observable<PaginatedResponse<INucleoUpdate>> {
    let params = new HttpParams().set('page', page);
    if (size) params = params.set('size', size);
    if (filters.nombreZona) params = params.set('nombreZona', filters.nombreZona);
    if (filters.idZonaFk !== undefined) params = params.set('idZonaFk', filters.idZonaFk);
    if (filters.idBarrioFk !== undefined) params = params.set('idBarrioFk', filters.idBarrioFk);
    if (filters.busqueda) params = params.set('busqueda', filters.busqueda);

    params = withColumnFilters(params, filters);
    return this.http
      .get<PaginatedResponse<INucleoUpdate> | SpringPageDto<INucleoUpdate>>(`${this.URL}/nucleosFamiliares/list`, { params, context: checkToken() })
      .pipe(map(payload => this.normalizePagedNucleos(payload, page, size ?? 10)));
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

  private normalizePagedNucleos(
    payload: PaginatedResponse<INucleoUpdate> | SpringPageDto<INucleoUpdate>,
    fallbackPage: number,
    fallbackSize: number,
  ): PaginatedResponse<INucleoUpdate> {
    if ('page' in payload && payload.page) {
      const content = payload.content ?? [];
      const totalElements = payload.page.totalElements ?? content.length;
      const totalPages = payload.page.totalPages ?? 1;
      const pageSize = payload.page.size ?? fallbackSize;
      const pageNumber = payload.page.number ?? fallbackPage;

      return {
        content,
        pageable: {
          pageNumber,
          pageSize,
          offset: pageNumber * pageSize,
          paged: true,
          unpaged: false,
          sort: { empty: true, sorted: false, unsorted: true },
        },
        last: pageNumber >= totalPages - 1,
        totalElements,
        totalPages,
        size: pageSize,
        number: pageNumber,
        sort: { empty: true, sorted: false, unsorted: true },
        first: pageNumber === 0,
        numberOfElements: content.length,
        empty: content.length === 0,
      };
    }

    return payload as PaginatedResponse<INucleoUpdate>;
  }
}
