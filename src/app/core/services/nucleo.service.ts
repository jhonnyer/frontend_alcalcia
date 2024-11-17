import { Injectable } from '@angular/core';
import { nucleoList } from '../data/nucleo.data';
import { INucleo } from '../models/nucleo.model';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NucleoService {

  constructor() { }

  getAll(): Observable<INucleo[]>{
    return of(
      nucleoList
    ).pipe(delay(500))
  }

  getById(id: string):Observable<INucleo> {
    const index = nucleoList.findIndex(item => {
      return item.id === id
    })
    return of(nucleoList[index]).pipe(delay(500));
  }

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

}
