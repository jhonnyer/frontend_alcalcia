import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IActa } from '../models/acta.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
// import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ActasService {
  private readonly URL = environment.URL_API;
  private http = inject(HttpClient);

  getAll(): Observable<IActa[]> {
    return this.http.get<IActa[]>(`${this.URL}/actas/list`).pipe(
      tap(actas => {
        actas.forEach(acta => {
          // acta.fechaCreacion = this.formatDate(acta.fechaCreacion);
          // acta.fechaEntrega = this.formatDate(acta.fechaEntrega);
          acta.beneficiario.fechaNacimiento = this.formatDate(acta.beneficiario.fechaNacimiento);
        });
      })
    );
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extraemos solo la parte de la fecha
  }

}
