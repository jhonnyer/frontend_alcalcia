import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { inject } from '@angular/core';

export const authenticationGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Verificar si el token existe y no está expirado
  const token = tokenService.getToken();
  if (!token || tokenService.isTokenExpired()) {
    router.navigate(['/auth']);
    return false;
  }

  // Verificar estado del usuario
  const userState = tokenService.getUserState();
  if (userState !== 'A') {
    // Redirigir a página de cuenta no autorizada
    router.navigate(['/user-inactive']);
    return false;
  }

  return true;
};
