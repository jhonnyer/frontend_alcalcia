import { Injectable } from '@angular/core';
import { jwtDecode } from "jwt-decode";
import { IResponseLogin, ISecretariaAcceso } from '../models/responseLogin.model';
import { BehaviorSubject } from 'rxjs';

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
  private SECRETARY_KEY = 'active_secretary';
  private SECRETARIES_KEY = 'available_secretaries';
  private SECRETARY_PENDING_KEY = 'secretary_pending';

  // Observable para notificar cambios en el token
  private tokenChangesSubject = new BehaviorSubject<string | null>(this.getToken());
  tokenChanges$ = this.tokenChangesSubject.asObservable();

  // Método para verificar si localStorage está disponible
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  saveLoginResponse(response: IResponseLogin, secretaryPending = false) {
    if (this.isLocalStorageAvailable()) {
      // Guardar token
      this.saveToken(response.token);

      // Guardar rol
      localStorage.setItem(this.USER_ROLE_KEY, response.rol);

      // Guardar estado del usuario
      localStorage.setItem(this.USER_STATE_KEY, response.estadoUser);

      if (!secretaryPending && response.idSecretaria !== null && response.idSecretaria !== undefined) {
        localStorage.setItem(this.SECRETARY_KEY, String(response.idSecretaria));
      } else if (secretaryPending) {
        localStorage.removeItem(this.SECRETARY_KEY);
      }
      localStorage.setItem(this.SECRETARIES_KEY, JSON.stringify(response.secretarias ?? []));
      localStorage.setItem(this.SECRETARY_PENDING_KEY, String(secretaryPending));

      // Notificar cambio de token
      this.tokenChangesSubject.next(response.token);
    }
  }

  saveToken(token: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(this.TOKEN_KEY, token);
      // Notificar cambio de token
      this.tokenChangesSubject.next(token);
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

  getActiveSecretaryId(): number | null {
    if (this.isLocalStorageAvailable()) {
      const value = localStorage.getItem(this.SECRETARY_KEY);
      return value ? Number(value) : null;
    }
    return null;
  }

  getAvailableSecretaries(): ISecretariaAcceso[] {
    if (this.isLocalStorageAvailable()) {
      try {
        return JSON.parse(localStorage.getItem(this.SECRETARIES_KEY) ?? '[]');
      } catch {
        return [];
      }
    }
    return [];
  }

  hasPendingSecretarySelection(): boolean {
    return this.isLocalStorageAvailable()
      && localStorage.getItem(this.SECRETARY_PENDING_KEY) === 'true';
  }

  clearToken() {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_ROLE_KEY);
      localStorage.removeItem(this.USER_STATE_KEY);
      localStorage.removeItem(this.SECRETARY_KEY);
      localStorage.removeItem(this.SECRETARIES_KEY);
      localStorage.removeItem(this.SECRETARY_PENDING_KEY);
      // Notificar que el token ha sido eliminado
      this.tokenChangesSubject.next(null);
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
