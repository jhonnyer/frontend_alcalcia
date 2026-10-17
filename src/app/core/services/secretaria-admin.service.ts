import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import {
  ICoberturaDepartamento,
  ICoberturaDepartamentoRequest,
  ICoberturaMunicipio,
  ICoberturaMunicipioRequest,
  ICreateSecretariaRequest,
  IMembresiaSecretariaRequest,
  ISecretaria
} from '../models/secretaria.model';

@Injectable({ providedIn: 'root' })
export class SecretariaAdminService {
  private readonly URL = environment.URL_API;
  private readonly http = inject(HttpClient);

  getAll(): Observable<ISecretaria[]> {
    return this.http.get<ISecretaria[]>(`${this.URL}/administracion/secretarias`, { context: checkToken() });
  }

  create(data: ICreateSecretariaRequest): Observable<ISecretaria> {
    return this.http.post<ISecretaria>(`${this.URL}/administracion/secretarias`, data, { context: checkToken() });
  }

  updateActiveName(nombre: string): Observable<ISecretaria> {
    return this.http.put<ISecretaria>(
      `${this.URL}/administracion/secretarias/activa/nombre`,
      { nombre },
      { context: checkToken() }
    );
  }

  assignResponsible(idSecretaria: number, idResponsable: number, data: IMembresiaSecretariaRequest): Observable<unknown> {
    return this.http.post(
      `${this.URL}/administracion/secretarias/${idSecretaria}/membresias/${idResponsable}`,
      data,
      { context: checkToken() }
    );
  }

  getCoberturaMunicipal(idSecretaria: number): Observable<ICoberturaMunicipio[]> {
    return this.http.get<ICoberturaMunicipio[]>(
      `${this.URL}/administracion/secretarias/${idSecretaria}/cobertura-municipal`,
      { context: checkToken() }
    );
  }

  getCoberturaDepartamental(idSecretaria: number): Observable<ICoberturaDepartamento[]> {
    return this.http.get<ICoberturaDepartamento[]>(
      `${this.URL}/administracion/secretarias/${idSecretaria}/cobertura-departamental`,
      { context: checkToken() }
    );
  }

  assignCoberturaDepartamental(idSecretaria: number, data: ICoberturaDepartamentoRequest): Observable<void> {
    return this.http.post<void>(
      `${this.URL}/administracion/secretarias/${idSecretaria}/cobertura-departamental`,
      data,
      { context: checkToken() }
    );
  }

  removeCoberturaDepartamental(idSecretaria: number, idDepartamento: number): Observable<void> {
    return this.http.delete<void>(
      `${this.URL}/administracion/secretarias/${idSecretaria}/cobertura-departamental/${idDepartamento}`,
      { context: checkToken() }
    );
  }

  assignCoberturaMunicipal(idSecretaria: number, data: ICoberturaMunicipioRequest): Observable<void> {
    return this.http.post<void>(
      `${this.URL}/administracion/secretarias/${idSecretaria}/cobertura-municipal`,
      data,
      { context: checkToken() }
    );
  }

  removeCoberturaMunicipal(idSecretaria: number, idMunicipio: number): Observable<void> {
    return this.http.delete<void>(
      `${this.URL}/administracion/secretarias/${idSecretaria}/cobertura-municipal/${idMunicipio}`,
      { context: checkToken() }
    );
  }

  delete(idSecretaria: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/administracion/secretarias/${idSecretaria}`, { context: checkToken() });
  }
}
