import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IBarrio } from '../models/barrio.model';

@Injectable({
  providedIn: 'root'
})
export class BarrioService {

  private http = inject(HttpClient);

  getAll(){
    return this.http.get<IBarrio[]>(`${environment.URL_API}/barrios/list`);
  }

}
