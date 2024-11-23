import { inject, Injectable } from '@angular/core';
import { nucleoList } from '../data/nucleo.data';
import { INucleo, INucleoUpdate } from '../models/nucleo.model';
import { environment } from '../../../environments/environment';
import { delay, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class NucleoService {
  private readonly URL = environment.URL_API;

  private http = inject(HttpClient);

  getAll(page: number): Observable<PaginatedResponse<INucleoUpdate>> {
    return this.http.get<PaginatedResponse<INucleoUpdate>>(`${this.URL}/nucleosFamiliares/list?page=${page}`);
  }

  getById(id: string):Observable<INucleoUpdate> {
    return this.http.get<INucleoUpdate>(`${this.URL}/nucleosFamiliares/${id}`);
  }

  post(data: any):Observable<any>{
    return this.http.post(`${this.URL}/nucleosFamiliares`, data);
  }



  /*
  updateById(itemNucleo: INucleo):Observable<INucleo> {
    const index = nucleoList.findIndex(item => {
      return item.id === itemNucleo.id
    })

    nucleoList[index] = itemNucleo;

    return of(nucleoList[index]).pipe(delay(500));
  }

  deleteById(id: string):Observable<INucleo> {
    const index = nucleoList.findIndex(item => {
      return item.id === id
    })
    nucleoList.slice(index, 1);
    return of(nucleoList[index]).pipe(delay(500));
  }
  */
}
