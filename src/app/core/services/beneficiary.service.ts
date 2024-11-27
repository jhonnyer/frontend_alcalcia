import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IBeneficiario, IBeneficiarioUnique } from '../models/beneficiary.models';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IBeneficiario[]> {
    return this.http.get<IBeneficiario[]>(`${this.URL}/beneficiarios`).pipe(
      tap(item => {
        item.forEach(beneficiario => {
          beneficiario.fechaNacimiento = this.formatDate(beneficiario.fechaNacimiento);
        });
      })
    );
  }

  getById(id: string): Observable<IBeneficiarioUnique>{
    return this.http.get<IBeneficiarioUnique>(`${this.URL}/beneficiarios/${id}`).pipe(
      tap(item => {
        item.fechaNacimiento = this.formatDate(item.fechaNacimiento);
      })
    );
  }

  /*
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
  */

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }
}
