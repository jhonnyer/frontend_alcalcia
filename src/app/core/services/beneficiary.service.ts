import { inject, Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { IBeneficiario, IBeneficiarioUnique } from '../models/beneficiary.models';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ResponseStandarUnique } from '../models/response.model';
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

export interface BeneficiaryPagedFilters {
  idNucleoFk?: number;
  idProyecto?: number;
  busqueda?: string;
}

interface RawNucleoFamiliar {
  idNucleo?: number | string | null;
  idNucleoFk?: number | string | null;
  idNucleoFK?: number | string | null;
  nombreNucleo?: string | null;
  direccion?: string | null;
  nombreBarrio?: string | null;
  nombreZona?: string | null;
}

type RawBeneficiario = Partial<IBeneficiario> & {
  idNucleoFK?: number | string | null;
  nucleoFamiliar?: RawNucleoFamiliar;
};

type BeneficiarioPayload =
  | RawBeneficiario[]
  | { respuesta: RawBeneficiario[] }
  | SpringPageDto<RawBeneficiario>
  | PaginatedResponse<RawBeneficiario>;

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryService {
  private URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IBeneficiario[]> {
    return this.http
      .get<RawBeneficiario[] | { respuesta: RawBeneficiario[] }>(`${this.URL}/beneficiarios`, { context: checkToken() })
      .pipe(
        map(payload => {
          const list: RawBeneficiario[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.respuesta)
              ? payload.respuesta
              : [];

          return list.map((raw: RawBeneficiario) => {
          const nucleo = raw.nucleoFamiliar ?? {};
          const rawNucleoId = raw.idNucleoFk ?? raw.idNucleoFK ?? nucleo.idNucleoFk ?? nucleo.idNucleoFK ?? nucleo.idNucleo;
          raw.idNucleoFk = rawNucleoId === null || rawNucleoId === undefined || rawNucleoId === ''
            ? null
            : Number(rawNucleoId);
          raw.nombreNucleo = raw.nombreNucleo ?? nucleo.nombreNucleo ?? '';
          raw.direccionNucleo = raw.direccionNucleo ?? nucleo.direccion ?? '';
          raw.barrio = raw.barrio ?? nucleo.nombreBarrio ?? '';
          raw.zona = raw.zona ?? nucleo.nombreZona ?? '';
          if (raw.fechaNacimiento) {
            raw.fechaNacimiento = this.formatDate(raw.fechaNacimiento);
          }
          return raw as IBeneficiario;
          });
        })
      );
  }

  getPaged(page: number, size: number, filters: BeneficiaryPagedFilters = {}): Observable<PaginatedResponse<IBeneficiario>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters.idNucleoFk !== undefined) params = params.set('idNucleoFk', filters.idNucleoFk);
    if (filters.idProyecto !== undefined) params = params.set('idProyecto', filters.idProyecto);
    if (filters.busqueda) params = params.set('busqueda', filters.busqueda);

    return this.http
      .get<BeneficiarioPayload>(`${this.URL}/beneficiarios`, { params, context: checkToken() })
      .pipe(
        map(payload => this.normalizePagedBeneficiarios(payload, page, size)),
      );
  }


  getById(id: string): Observable<IBeneficiarioUnique>{
    return this.http.get<IBeneficiarioUnique>(`${this.URL}/beneficiarios/${id}`, { context: checkToken() }).pipe(
      tap(item => {
        item.fechaNacimiento = this.formatDate(item.fechaNacimiento);
      })
    );
  }

  getByCedula(id: string): Observable<IBeneficiarioUnique>{
    return this.http.get<IBeneficiarioUnique>(`${this.URL}/beneficiarios/buscar-cedula/${id}`, { context: checkToken() }).pipe(
      tap(item => {
        item.fechaNacimiento = this.formatDate(item.fechaNacimiento);
      })
    );
  }

  /**
   * Busqueda de beneficiarios por numero de documento, nombres y apellidos
   */
  getByNameAndLastNameAndDocument(names: string): Observable<IBeneficiarioUnique[]>{
    return this.http.get<IBeneficiarioUnique[]>(`${this.URL}/beneficiarios/buscar/${names}`, { context: checkToken() }).pipe(
      tap(item => {
        item.forEach(beneficiario => {
          beneficiario.fechaNacimiento = this.formatDate(beneficiario.fechaNacimiento);
        });
      })
    );
  }

  post(beneficiario: Partial<IBeneficiario>): Observable<ResponseStandarUnique<IBeneficiario>> {
    return this.http
      .post<ResponseStandarUnique<IBeneficiario>>(
        `${this.URL}/beneficiarios`,
        beneficiario,
        { context: checkToken() }
      )
      .pipe(
        tap(resp => {
          const item = resp.respuesta;
          if (item && item.fechaNacimiento) {
            item.fechaNacimiento = this.formatDate(item.fechaNacimiento);
          }
        })
      );
  }

  update(
    idBeneficiario: string,
    beneficiario: Partial<IBeneficiarioUnique>
  ): Observable<ResponseStandarUnique<IBeneficiarioUnique>> {
    return this.http
      .put<ResponseStandarUnique<IBeneficiarioUnique>>(
        `${this.URL}/beneficiarios/${idBeneficiario}`,
        beneficiario,
        { context: checkToken() }
      )
      .pipe(
        tap(resp => {
          const item = resp.respuesta;
          if (item && item.fechaNacimiento) {
            item.fechaNacimiento = this.formatDate(item.fechaNacimiento);
          }
        })
      );
  }
  

  updateById(idBeneficiario: string, beneficiario: Partial<IBeneficiarioUnique>):Observable<IBeneficiarioUnique> {
    return this.http.put<IBeneficiarioUnique>(`${this.URL}/beneficiarios/${idBeneficiario}`, beneficiario, { context: checkToken() });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }

  delete(idBeneficiario: string): Observable<any> {
    return this.http.delete(`${this.URL}/beneficiarios/eliminar/${idBeneficiario}`, { context: checkToken() });
  }

  private normalizePagedBeneficiarios(payload: BeneficiarioPayload, page: number, size: number): PaginatedResponse<IBeneficiario> {
    const mapRaw = (raw: RawBeneficiario): IBeneficiario => {
      const nucleo = raw.nucleoFamiliar ?? {};
      const rawNucleoId = raw.idNucleoFk ?? raw.idNucleoFK ?? nucleo.idNucleoFk ?? nucleo.idNucleoFK ?? nucleo.idNucleo;
      raw.idNucleoFk = rawNucleoId === null || rawNucleoId === undefined || rawNucleoId === ''
        ? null
        : Number(rawNucleoId);
      raw.nombreNucleo = raw.nombreNucleo ?? nucleo.nombreNucleo ?? '';
      raw.direccionNucleo = raw.direccionNucleo ?? nucleo.direccion ?? '';
      raw.barrio = raw.barrio ?? nucleo.nombreBarrio ?? '';
      raw.zona = raw.zona ?? nucleo.nombreZona ?? '';
      if (raw.fechaNacimiento) {
        raw.fechaNacimiento = this.formatDate(raw.fechaNacimiento);
      }
      return raw as IBeneficiario;
    };

    if (Array.isArray(payload)) {
      const content = payload.map(mapRaw);
      const total = content.length;
      return {
        content,
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

    if ('content' in payload) {
      if ('page' in payload && payload.page) {
        const dto = payload as SpringPageDto<RawBeneficiario>;
        const content = (dto.content ?? []).map(mapRaw);
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

      return {
        ...payload,
        content: payload.content.map(mapRaw),
      } as PaginatedResponse<IBeneficiario>;
    }

    const content = (payload.respuesta ?? []).map(mapRaw);
    const total = content.length;
    return {
      content,
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
}
