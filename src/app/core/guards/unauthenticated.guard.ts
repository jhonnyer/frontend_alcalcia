import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { inject } from '@angular/core';

export const unauthenticatedGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Verificar si NO hay token o está expirado (usuario no autenticado)
  const token = tokenService.getToken();
  if (!token || tokenService.isTokenExpired()) {
    // Si no hay token o está expirado, permitir el acceso (retornar true)
    return true;
  }

  // Verificar estado del usuario
  const userState = tokenService.getUserState();
  if (userState !== 'A') {
    // Si el usuario no está activo, permitir el acceso
    return true;
  }

  // Si hay un token válido y el usuario está activo, redirigir al dashboard
  router.navigate(['/dashboard']);
  return false;
};
