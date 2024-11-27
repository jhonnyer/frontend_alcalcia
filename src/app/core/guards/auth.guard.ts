import { CanActivateFn, Router  } from '@angular/router';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Verificar si el token existe y no está expirado
  const token = tokenService.getToken();
  if (!token || tokenService.isTokenExpired()) {
    router.navigate(['/auth']);
    return false;
  }

  // Obtener el rol y estado del usuario
  const userRole = tokenService.getUserRole();
  const userState = tokenService.getUserState();

  // Obtener el rol requerido de la ruta
  const requiredRole = route.data['role'] as string;

  // Verificar estado del usuario
  if (userState !== 'A') {
    // Redirigir a página de cuenta no autorizada
    router.navigate(['/user-inactive']);
    return false;
  }

  // Si hay rol requerido, verificarlo
  if (requiredRole && userRole !== requiredRole) {
    router.navigate(['/access-denied']);
    return false;
  }

  return true;
};
