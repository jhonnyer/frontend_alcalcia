import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { inject } from '@angular/core';

export const authenticationGuard: CanMatchFn = (route, segments) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Verificar si el token existe y no está expirado
  const token = tokenService.getToken();
  if (!token || tokenService.isTokenExpired()) {
    tokenService.clearToken();
    console.log('No hay token o está expirado');
    router.navigate(['/auth']);
    return false;
  }

  // Verificar estado del usuario
  const userState = tokenService.getUserState();
  if (userState !== 'A') {
    // Redirigir a página de cuenta no autorizada
    tokenService.clearToken();
    alert('Usuario inactivo');
    router.navigate(['/auth']);
    return false;
  }

  return true;
};
