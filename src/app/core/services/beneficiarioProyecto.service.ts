import { inject, Injectable } from '@angular/core';
import { IBeneficiarioProyecto } from '../models/beneficiarioProyecto.model';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PaginatedResponse } from '../models/pagination.model';
import { checkToken } from '../interceptors/token-interceptor.interceptor';

@Injectable({
  providedIn: 'root'
})
export class BeneficiarioProyectoService {

  private readonly URL = environment.URL_API;
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


  post(beneficiarioProyecto: Partial<IBeneficiarioProyecto>): Observable<IBeneficiarioProyecto> {
    return this.http.post<IBeneficiarioProyecto>(`${this.URL}/beneficiarios-proyectos`, beneficiarioProyecto ,{ context: checkToken() }).pipe(
      tap(beneficiario => {
        if(beneficiario.fechaFin){
          beneficiario.fechaFin = this.formatDate(beneficiario.fechaFin);
        }
        beneficiario.fechaInicio = this.formatDate(beneficiario.fechaInicio);
      })
    );
  }

  asignarBeneficiarioAProyecto(proyectoId: string,beneficiarioProyecto: Partial<IBeneficiarioProyecto>): Observable<IBeneficiarioProyecto> {
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
}
