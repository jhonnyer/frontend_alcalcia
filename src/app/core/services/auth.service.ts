import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { IResponseLogin } from '../models/responseLogin.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  role = signal('');

  proxyUrl = "/auth/login";

  private readonly URL = environment.URL_API;


  login(data: any): Observable<IResponseLogin> {
    console.log("LOGEARSE: ", data)
    return this.http.post<IResponseLogin>(`/api/auth/login`, data)
    // return this.http.post<IResponseLogin>(`${this.URL}/auth/login`, data)
      .pipe(
        tap(response => {
          // Guardar toda la respuesta de login
          this.tokenService.saveLoginResponse(response);
          // Manejar la navegación basada en el estado del usuario
          if (response.estadoUser === 'A') {
            // Usuario activo, navegar al home
            this.router.navigate(['/home']);
          } else {
            // Usuario inactivo, navegar a página de no autorizado
            this.router.navigate(['/user-inactive']);
          }
        })
      );
  }

  logout() {
    // Método para cerrar sesión
    this.tokenService.clearToken();
    this.router.navigate(['/auth']);
  }
}
