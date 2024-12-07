import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IBeneficiario, IBeneficiarioUnique } from '../models/beneficiary.models';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IBeneficiario[]> {
    return this.http.get<IBeneficiario[]>(`${this.URL}/beneficiarios`, { context: checkToken() }).pipe(
      tap(item => {
        item.forEach(beneficiario => {
          beneficiario.fechaNacimiento = this.formatDate(beneficiario.fechaNacimiento);
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

  post(beneficiario: Partial<IBeneficiario>): Observable<IBeneficiario>{
    return this.http.post<IBeneficiario>(`${this.URL}/beneficiarios}`, beneficiario, { context: checkToken() }).pipe(
      tap(item => {
        item.fechaNacimiento = this.formatDate(item.fechaNacimiento);
      })
    );
  }

  update(idBeneficiario: string, beneficiario: Partial<IBeneficiarioUnique>): Observable<IBeneficiarioUnique>{

    return this.http.put<IBeneficiarioUnique>(`${this.URL}/beneficiarios/${idBeneficiario}}`, beneficiario, { context: checkToken() }).pipe(
      tap(item => {
        item.fechaNacimiento = this.formatDate(item.fechaNacimiento);
      })
    );
  }

  updateById(idBeneficiario: string, beneficiario: Partial<IBeneficiarioUnique>):Observable<IBeneficiarioUnique> {
    console.log("Se envia: ", idBeneficiario)
    console.log("Se envia: ", beneficiario)
    return this.http.put<IBeneficiarioUnique>(`${this.URL}/beneficiarios/${idBeneficiario}`, beneficiario, { context: checkToken() });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }
}
