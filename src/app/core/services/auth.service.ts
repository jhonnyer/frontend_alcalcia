import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { IResponseLogin } from '../models/responseLogin.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  role = signal('');

  proxyUrl = "/auth/login";

  private readonly URL = environment.URL_API;


  login(data: any): Observable<IResponseLogin> {
    return this.http.post<IResponseLogin>(`/api/auth/login`, data)
      .pipe(
        tap(response => {
          // Guardar toda la respuesta de login
          this.tokenService.saveLoginResponse(response);
        })
      );
  }

  logout() {
    // Método para cerrar sesión
    this.tokenService.clearToken();
    // Redirigir a login o hacer cualquier otra limpieza necesaria
  }
}

/*
login(data: any): Observable<IResponseLogin>{
  console.log("Servicio login ",data)
  console.log(`Servicio login URL  ${this.URL}/auth/login`)
  // return this.http.post<any>(proxyUrl, {

  return this.http.post<IResponseLogin>(`/api/auth/login`, data)
  .pipe(
      tap(response => {
      console.log("Respuesta: ", response)
      this.tokenService.saveToken(response.token);
      })
  );
}
*/
