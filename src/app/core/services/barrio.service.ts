import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IBarrio } from '../models/barrio.model';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BarrioService {

  private http = inject(HttpClient);

  getAll(): Observable<IBarrio[]>{
    return this.http.get<IBarrio[]>(`${environment.URL_API}/barrios/list`, { context: checkToken() });
  }

  getById(id: number):Observable<IBarrio>{
    return this.http.get<IBarrio>(`${environment.URL_API}/barrios/${id}`, { context: checkToken() });
  }

  post(barrio: IBarrio): Observable<IBarrio>{
    return this.http.post<IBarrio>(`${environment.URL_API}/barrios`, barrio ,{ context: checkToken() });
  }

  update(barrio: IBarrio): Observable<IBarrio>{
    return this.http.put<IBarrio>(`${environment.URL_API}/barrios/${barrio.idBarrio}`, barrio ,{ context: checkToken() });
  }

  delete(idBarrio: string): void{
    this.http.delete(`${environment.URL_API}/barrios/${idBarrio}`,{ context: checkToken() });
  }

}
