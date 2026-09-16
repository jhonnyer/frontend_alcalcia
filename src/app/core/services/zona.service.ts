import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IZona } from '../models/zona.models';
import { Observable, tap } from 'rxjs';
import { checkToken } from '../interceptors/token-interceptor.interceptor';
@Injectable({
  providedIn: 'root'
})
export class ZonaService {
  private http = inject(HttpClient);

  getAll(): Observable<IZona[]> {
    return this.http.get<IZona[]>(`${environment.URL_API}/zonas/list`, { context: checkToken() }).pipe(
      tap({
        error: (error) => console.error('Error al obtener zonas', error)
      })
    );
  }

  getById(id:number): Observable<any> {
    return this.http.get<any>(`${environment.URL_API}/zonas/${id}`, { context: checkToken() }).pipe(
      tap({
        error: (error) => console.error('Error al obtener zonas por id', error)
      })
    );
  }

  post(zona: Partial<IZona>): Observable<IZona>{
    return this.http.post<IZona>(`${environment.URL_API}/zonas`, zona ,{ context: checkToken() })
  }

  //Actualizar zonas
  put(zona: IZona): Observable<IZona> {
    return this.http.put<any>(`${environment.URL_API}/zonas/${zona.idZona}`, {
      nombreZona: zona.nombreZona,
      ubicacion: zona.ubicacion
    } ,{ context: checkToken() })
  }

  //Eliminar
  delete(idZona: string): void{
    this.http.delete(`${environment.URL_API}/zonas/${idZona}`, { context: checkToken() });
  }
}

