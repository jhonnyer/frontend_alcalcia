import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { IResponseLogin } from '../models/responseLogin.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private URL = environment.URL_API;

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  role = signal('');

  login(data: any): Observable<IResponseLogin> {
    return this.http.post<IResponseLogin>(`${this.URL}/auth/login`, data);
  }

  changeSecretary(idSecretaria: number): Observable<IResponseLogin> {
    return this.http.post<IResponseLogin>(`${this.URL}/auth/secretaria/${idSecretaria}`, {});
  }

  logout() {
    // Método para cerrar sesión
    this.tokenService.clearToken();
    this.router.navigate(['/auth']);
  }

  hasRole(role: string | string[]): boolean {
    const userRole = this.tokenService.getUserRole();

    if (!userRole) return false;

    const allowedRoles = Array.isArray(role) ? role : [role];
    return allowedRoles.includes(userRole);
  }
}
