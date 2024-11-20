import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IZona } from '../models/zona.models';
@Injectable({
  providedIn: 'root'
})
export class ZonaService {
  private http = inject(HttpClient);

  getAll(){
    //return this.http.get<IZona[]>(`http://localhost:8080/api/zonas/list`);
    return this.http.get<IZona[]>(`${environment.URL_API}/zonas/list`);
  }

}
