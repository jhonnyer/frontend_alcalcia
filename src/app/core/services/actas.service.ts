import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IActa, IActaById, ICreateActa } from '../models/acta.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { TokenService } from './token.service';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { ResponseStandar, ResponseStandarUnique } from '../models/response.model';
// import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ActasService {
  // private readonly URL = environment.URL_API;
  private readonly URL = '/api';
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
    return this.http.get<ResponseStandar<IActaById>>(`${this.URL}/actas//responsable/${params}`, { context: checkToken() }).pipe(
      tap(acta => {
        acta.respuesta[0].beneficiario.fechaNacimiento = this.formatDate(acta.respuesta[0].beneficiario.fechaNacimiento);
      })
    );
  }

  post(acta:Partial<ICreateActa>): Observable<ICreateActa> {
    return this.http.post<ICreateActa>(`${this.URL}/actas`, acta ,{ context: checkToken() });
  }

  update(acta:Partial<IActa>): Observable<ResponseStandarUnique<IActaById>> {
    return this.http.put<ResponseStandarUnique<IActaById>>(`${this.URL}/actas/${acta.idActa}`, acta ,{ context: checkToken() })
    /*.pipe(
      tap(acta => {
        acta.beneficiario.fechaNacimiento = this.formatDate(acta.beneficiario.fechaNacimiento);
      })
    );*/
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

}
