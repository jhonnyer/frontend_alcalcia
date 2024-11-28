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
  private USER_STATE_KEY = 'user_state';

  // Método para verificar si localStorage está disponible
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  saveLoginResponse(response: IResponseLogin) {
    if (this.isLocalStorageAvailable()) {
      // Guardar token
      this.saveToken(response.token);

      // Guardar rol
      localStorage.setItem(this.USER_ROLE_KEY, response.rol);

      // Guardar estado del usuario
      localStorage.setItem(this.USER_STATE_KEY, response.estadoUser);
    }
  }

  saveToken(token: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (this.isLocalStorageAvailable()) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getUserRole(): string | null {
    if (this.isLocalStorageAvailable()) {
      return localStorage.getItem(this.USER_ROLE_KEY);
    }
    return null;
  }

  getUserState(): string | null {
    if (this.isLocalStorageAvailable()) {
      return localStorage.getItem(this.USER_STATE_KEY);
    }
    return null;
  }

  clearToken() {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_ROLE_KEY);
      localStorage.removeItem(this.USER_STATE_KEY);
    }
  }

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
