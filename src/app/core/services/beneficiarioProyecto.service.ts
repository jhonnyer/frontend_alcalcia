import { inject, Injectable } from '@angular/core';
import { TableColumnFilters, withColumnFilters } from '../models/table-column-filters';
import { IBeneficiarioProyecto } from '../models/beneficiarioProyecto.model';
import { environment } from '../../../environments/environment';
import { map, Observable, tap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ResponseStandarUnique } from '../models/response.model';
import { PaginatedResponse } from '../models/pagination.model';

export interface BeneficiarioProyectoPagedFilters extends TableColumnFilters {
  idProyecto?: number;
  busqueda?: string;
}

interface SpringPageDto<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BeneficiarioProyectoService {

  private URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IBeneficiarioProyecto[]> {
    return this.http.get<IBeneficiarioProyecto[]>(`${this.URL}/beneficiarios-proyectos/list`, { context: checkToken() }).pipe(
      tap(beneficiarios => {
        beneficiarios.forEach(beneficiario => {
          if(beneficiario.fechaFin){
            beneficiario.fechaFin = this.formatDate(beneficiario.fechaFin);
          }
          beneficiario.fechaInicio = this.formatDate(beneficiario.fechaInicio);
        });
      })
    );
  }

  getPaged(
    page: number,
    size: number,
    filters: BeneficiarioProyectoPagedFilters = {}
  ): Observable<PaginatedResponse<IBeneficiarioProyecto>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters.idProyecto !== undefined) params = params.set('idProyecto', filters.idProyecto);
    if (filters.busqueda) params = params.set('busqueda', filters.busqueda);

    return this.http
      .get<PaginatedResponse<IBeneficiarioProyecto> | SpringPageDto<IBeneficiarioProyecto> | IBeneficiarioProyecto[]>(`${this.URL}/beneficiarios-proyectos/list`, { params: withColumnFilters(params, filters), context: checkToken() })
      .pipe(
        map(payload => this.normalizePaged(payload, page, size)),
        tap(response => {
          response.content.forEach(item => {
            if (item.fechaFin) {
              item.fechaFin = this.formatDate(item.fechaFin);
            }
            item.fechaInicio = this.formatDate(item.fechaInicio);
          });
        })
      );
  }

  getAllById(id: string): Observable<IBeneficiarioProyecto> {
    return this.http.get<IBeneficiarioProyecto>(`${this.URL}/beneficiarios-proyectos/${id}`, { context: checkToken() }).pipe(
      tap(beneficiario => {
        if(beneficiario.fechaFin){
          beneficiario.fechaFin = this.formatDate(beneficiario.fechaFin);
        }
        beneficiario.fechaInicio = this.formatDate(beneficiario.fechaInicio);
      })
    );
  }

  getBeneficiarioByIdProyecto(idProyecto: string): Observable<IBeneficiarioProyecto> {
    return this.http.get<IBeneficiarioProyecto>(`${this.URL}/beneficiarios-proyectos/${idProyecto}`, { context: checkToken() }).pipe(
      tap(beneficiario => {
        if(beneficiario.fechaFin){
          beneficiario.fechaFin = this.formatDate(beneficiario.fechaFin);
        }
        beneficiario.fechaInicio = this.formatDate(beneficiario.fechaInicio);
      })
    );
  }

  getBeneficiarioProyectoByCedula(cc: string): Observable<IBeneficiarioProyecto[]> {
    return this.http.get<IBeneficiarioProyecto[]>(`${this.URL}/beneficiarios-proyectos/buscar-por-cedula/${cc}`, { context: checkToken() });
  }

  post(beneficiarioProyecto: Partial<IBeneficiarioProyecto>): Observable<IBeneficiarioProyecto> {
    return this.http.post<ResponseStandarUnique<IBeneficiarioProyecto>>(
      `${this.URL}/beneficiarios-proyectos`,
      beneficiarioProyecto,
      { context: checkToken() }
    ).pipe(
      map(resp => resp.respuesta), 
      tap(beneficiario => {
        if (beneficiario.fechaFin) {
          beneficiario.fechaFin = this.formatDate(beneficiario.fechaFin);
        }
        beneficiario.fechaInicio = this.formatDate(beneficiario.fechaInicio);
      })
    );
  }


  updateById(proyectoId: string, beneficiarioProyecto: Partial<IBeneficiarioProyecto>): Observable<IBeneficiarioProyecto> {
    return this.http.put<IBeneficiarioProyecto>(`${this.URL}/beneficiarios-proyectos/${proyectoId}`, beneficiarioProyecto, { context: checkToken() }).pipe(
      tap(beneficiario => {
        if(beneficiario.fechaFin){
          beneficiario.fechaFin = this.formatDate(beneficiario.fechaFin);
        }
        beneficiario.fechaInicio = this.formatDate(beneficiario.fechaInicio);
      })
    );
  }

  deleteById(id: string): void {
    this.http.delete(`${this.URL}/beneficiarios-proyectos/${id}`, { context: checkToken() });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }

  private normalizePaged(
    payload: PaginatedResponse<IBeneficiarioProyecto> | SpringPageDto<IBeneficiarioProyecto> | IBeneficiarioProyecto[],
    page: number,
    size: number,
  ): PaginatedResponse<IBeneficiarioProyecto> {
    if (Array.isArray(payload)) {
      const total = payload.length;
      return {
        content: payload,
        pageable: {
          pageNumber: page,
          pageSize: size,
          offset: page * size,
          paged: false,
          unpaged: true,
          sort: { empty: true, sorted: false, unsorted: true },
        },
        last: true,
        totalElements: total,
        totalPages: 1,
        size,
        number: page,
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: total,
        empty: total === 0,
      };
    }

    if ('page' in payload && payload.page) {
      const content = payload.content ?? [];
      const totalElements = payload.page.totalElements ?? content.length;
      const totalPages = payload.page.totalPages ?? 1;
      const pageSize = payload.page.size ?? size;
      const pageNumber = payload.page.number ?? page;

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

    return payload as PaginatedResponse<IBeneficiarioProyecto>;
  }
}
