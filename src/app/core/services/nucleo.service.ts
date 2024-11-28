import { inject, Injectable } from '@angular/core';
import { INucleoUpdate } from '../models/nucleo.model';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PaginatedResponse } from '../models/pagination.model';
import { checkToken } from '../interceptors/token-interceptor.interceptor';

@Injectable({
  providedIn: 'root'
})
export class NucleoService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(page: number): Observable<PaginatedResponse<INucleoUpdate>> {
    return this.http.get<PaginatedResponse<INucleoUpdate>>(`${this.URL}/nucleosFamiliares/list?page=${page}`, { context: checkToken() });
  }

  getById(id: string): Observable<INucleoUpdate> {
    return this.http.get<INucleoUpdate>(`${this.URL}/nucleosFamiliares/${id}`, { context: checkToken() }).pipe(
      tap(item => {
        item.beneficiarios.forEach(beneficiario => {
          beneficiario.fechaNacimiento = this.formatDate(beneficiario.fechaNacimiento);
        });
      })
    );
  }

  post(data: INucleoUpdate):Observable<INucleoUpdate>{
    return this.http.post<INucleoUpdate>(`${this.URL}/nucleosFamiliares`, data, { context: checkToken() });
  }

  updateById(nucleoID: string, itemNucleo: INucleoUpdate):Observable<any> {
    console.log(`URL = ${this.URL}/nucleosFamiliares/${nucleoID}`)
    console.log(`DATA = ${itemNucleo}`)
    return this.http.put<any>(`${this.URL}/nucleosFamiliares/${nucleoID}`, itemNucleo, { context: checkToken() });
  }

  deleteById(id: string) {
    this.http.delete(`${this.URL}/nucleosFamiliares/${id}`, { context: checkToken() });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }
}
