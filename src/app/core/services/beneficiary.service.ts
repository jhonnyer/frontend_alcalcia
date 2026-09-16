import { inject, Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { IBeneficiario, IBeneficiarioUnique } from '../models/beneficiary.models';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ResponseStandarUnique } from '../models/response.model';

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
}
