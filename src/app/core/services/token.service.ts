import { Injectable } from '@angular/core';
import { jwtDecode } from "jwt-decode";
import { IResponseLogin } from '../models/responseLogin.model';

interface JwtPayload {
  id: string;
  role: string;
  // Otros campos que puedas tener en tu JWT
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private TOKEN_KEY = 'auth_token';
  private USER_ROLE_KEY = 'user_role';

  // Guardar token y rol al iniciar sesión
  saveLoginResponse(response: IResponseLogin) {
    // Guardar token
    this.saveToken(response.token);

    // Guardar rol
    localStorage.setItem(this.USER_ROLE_KEY, response.rol);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  // Método para limpiar el token (logout)
  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
  }

  // Método opcional para verificar si el token está expirado
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp ? decoded.exp < currentTime : true;
    } catch (error) {
      return true;
    }
  }

  decodeToken(): any | null {
    const token = this.getToken();
    if (token) {
      try {
        return jwtDecode<any>(token);
      } catch (error) {
        console.error('Error decoding token', error);
        return null;
      }
    }
    return null;
  }

  // getUserRole(): string | null {
  //   const decodedToken = this.decodeToken();
  //   return decodedToken ? decodedToken.role : null;
  // }

}
