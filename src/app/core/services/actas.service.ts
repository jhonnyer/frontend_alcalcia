import { inject, Injectable } from '@angular/core';
import { TableColumnFilters, withColumnFilters } from '../models/table-column-filters';
import { Observable, map, tap } from 'rxjs';
import { IActa, IActaById, ICreateActa, ICreateActaResponse } from '../models/acta.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams  } from '@angular/common/http';
import { TokenService } from './token.service';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ResponseStandar, ResponseStandarUnique } from '../models/response.model';
import { PaginatedResponse } from '../models/pagination.model';

interface SpringPageDto<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ActasPagedFilters extends TableColumnFilters {
  estado?: string;
  prioridad?: string;
  idProyecto?: number;
  busqueda?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActasService {
  private URL = environment.URL_API;
  //private readonly URL = '/api';
  private http = inject(HttpClient);

  getAll(): Observable<IActa[]> {
    return this.http.get<IActa[]>(`${this.URL}/actas/list`, { context: checkToken() }).pipe(
      tap(actas => {
        actas.forEach(acta => {
          acta.beneficiario.fechaNacimiento = this.formatDate(acta.beneficiario.fechaNacimiento);
        });
      })
    );
  }

  getPaged(page: number, size: number, filters: ActasPagedFilters = {}): Observable<PaginatedResponse<IActa>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.prioridad) params = params.set('prioridad', filters.prioridad);
    if (filters.idProyecto !== undefined) params = params.set('idProyecto', filters.idProyecto);
    if (filters.busqueda) params = params.set('busqueda', filters.busqueda);
    if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);

    params = withColumnFilters(params, filters);
    return this.http
      .get<PaginatedResponse<IActa> | SpringPageDto<IActa> | IActa[]>(`${this.URL}/actas/list`, { params, context: checkToken() })
      .pipe(
        map(payload => this.normalizePagedActas(payload, page, size)),
        tap(response => {
          response.content.forEach(acta => {
            acta.beneficiario.fechaNacimiento = this.formatDate(acta.beneficiario.fechaNacimiento);
          });
        })
      );
  }

  getCountActas(idBeneficiario: string): Observable<number> {
    return this.http.get<number>(`${this.URL}/actas/counActas/${idBeneficiario}`, { context: checkToken() });
  }

  getById(idActa: string): Observable<ResponseStandarUnique<IActaById>> {
    return this.http.get<ResponseStandarUnique<IActaById>>(`${this.URL}/actas/${idActa}`, { context: checkToken() })
    // .pipe(
    //   tap((acta:ResponseStandar<IActaById>) => {
    //     acta.respuesta[0].beneficiario.fechaNacimiento = this.formatDate(acta.respuesta[0].beneficiario.fechaNacimiento);
    //   })
    // );
  }

  getByEstado(estadoActa: string): Observable<ResponseStandar<IActaById>> {
    return this.http.get<ResponseStandar<IActaById>>(`${this.URL}/actas/estado/${estadoActa}`, { context: checkToken() }).pipe(
      tap(acta => {
        acta.respuesta[0].beneficiario.fechaNacimiento = this.formatDate(acta.respuesta[0].beneficiario.fechaNacimiento);
      })
    );
  }

  getByPrioridad(prioridadActa: string): Observable<ResponseStandar<IActaById>> {
    return this.http.get<ResponseStandar<IActaById>>(`${this.URL}/actas/estado/${prioridadActa}`, { context: checkToken() }).pipe(
      tap(acta => {
        acta.respuesta[0].beneficiario.fechaNacimiento = this.formatDate(acta.respuesta[0].beneficiario.fechaNacimiento);
      })
    );
  }

  getByFecha(fechaInicio: string, fechaFin: string): Observable<ResponseStandar<IActaById>> {
    return this.http.get<ResponseStandar<IActaById>>(`${this.URL}/actas/fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, { context: checkToken() }).pipe(
      tap(acta => {
        acta.respuesta[0].beneficiario.fechaNacimiento = this.formatDate(acta.respuesta[0].beneficiario.fechaNacimiento);
      })
    );
  }

  /**
   *
   * @param params Parametros cedula, primerNombre, segundoNombre del responsable
   * @returns Object actas
   */
  getByParamsResponsable(params:string): Observable<ResponseStandar<IActaById>> {
    return this.http.get<ResponseStandar<IActaById>>(`${this.URL}/actas/responsable/${params}`, { context: checkToken() }).pipe(
      tap(acta => {
        acta.respuesta[0].beneficiario.fechaNacimiento = this.formatDate(acta.respuesta[0].beneficiario.fechaNacimiento);
      })
    );
  }

  post(acta:Partial<ICreateActa>): Observable<ICreateActaResponse> {
    return this.http.post<ICreateActaResponse>(`${this.URL}/actas`, acta ,{ context: checkToken() });
  }

  update(acta:Partial<IActa>): Observable<ResponseStandarUnique<IActaById>> {
    return this.http.put<ResponseStandarUnique<IActaById>>(`${this.URL}/actas/${acta.idActa}`, acta ,{ context: checkToken() })
  }

  updateAdjudicarUnResponsable(idActa: string, idResponsable: string): Observable<IActa> {
    return this.http.put<IActa>(`${this.URL}/actas/${idActa}/responsable/${idResponsable}`, { context: checkToken() }).pipe(
      tap(acta => {
        acta.beneficiario.fechaNacimiento = this.formatDate(acta.beneficiario.fechaNacimiento);
      })
    );
  }

  deleteById(id: string) {
    this.http.delete(`${this.URL}/actas/${id}`, { context: checkToken() });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }

  getExcelActas(fechaInicio?: string, fechaFin?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fechaInicio && fechaFin) {
      params = params.set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    }

    return this.http.get(`${this.URL}/actas/excel`, {
      params,
      responseType: 'blob',
      context: checkToken()
    });
  }

  getExcelProductosProyecto(fechaInicio?: string, fechaFin?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fechaInicio && fechaFin) {
      params = params.set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    }

    return this.http.get(`${this.URL}/proyectos/producto-excel`, {
      params,
      responseType: 'blob',
      context: checkToken()
    });
  }

  getPdfActaById(idActa: string): Observable<Blob> {
    return this.http.get(`${this.URL}/actas/pdf/${idActa}`, {
      responseType: 'blob',
      context: checkToken()
    });
  }

  private normalizePagedActas(
    payload: PaginatedResponse<IActa> | SpringPageDto<IActa> | IActa[],
    page: number,
    size: number,
  ): PaginatedResponse<IActa> {
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
          sort: { empty: true, sorted: false, unsorted: true }
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
      const dto = payload as SpringPageDto<IActa>;
      const content = dto.content ?? [];
      const totalElements = dto.page.totalElements ?? content.length;
      const totalPages = dto.page.totalPages ?? 1;
      const pageSize = dto.page.size ?? size;
      const pageNumber = dto.page.number ?? page;

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

    return payload as PaginatedResponse<IActa>;
  }

}
