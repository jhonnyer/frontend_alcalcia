import { inject, Injectable } from '@angular/core';
import { IPaquete } from '../models/paquetes.model';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { checkToken } from '../interceptors/token-interceptor.interceptor';

@Injectable({
  providedIn: 'root'
})
export class PaquetesService {

  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IPaquete[]> {
    return this.http.get<IPaquete[]>(`${this.URL}/paquetes/list`, { context: checkToken() });
  }

  getById(id: string): Observable<IPaquete> {
    return this.http.get<IPaquete>(`${this.URL}/paquetes/list/${id}`, { context: checkToken() });
  }

  post(paquete: Partial<IPaquete>): Observable<IPaquete> {
    return this.http.post<IPaquete>(`${this.URL}/paquetes`, paquete,{ context: checkToken() });
  }

  update(paquete: Partial<IPaquete>): Observable<IPaquete> {
    return this.http.put<IPaquete>(`${this.URL}/paquetes/${paquete.idPaquete}`, paquete,{ context: checkToken() });
  }

  delete(idPaquete: string): void{
    this.http.delete(`${this.URL}/paquetes/${idPaquete}`, { context: checkToken() });
  }

}
