import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { beneficiaryList } from '../data/beneficiary.data';
import { IBeneficiary } from '../models/beneficiary.models';

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryService {

  constructor() { }

  getAll(): Observable<IBeneficiary[]>{
    return of(beneficiaryList).pipe(delay(500))
  }

  getById(id: string): Observable<IBeneficiary>{
    const index = beneficiaryList.findIndex(item => {
      return item.id_beneficiario=== id;
    })
    return of(beneficiaryList[index]).pipe(delay(500));
  }

  getByNucleoId(id_nucleo: string): Observable<IBeneficiary[]>{
    const beneficiaries = beneficiaryList.filter(item => {
      return item.idNucleo === id_nucleo;
    })
    return of(beneficiaries).pipe(delay(500));
  }

  updateById(beneficiary: IBeneficiary): Observable<IBeneficiary>{
    const index = beneficiaryList.findIndex(item => {
      return item.id_beneficiario=== beneficiary.id_beneficiario;
    })

    return of(beneficiaryList[index]).pipe(delay(500));
  }
}
