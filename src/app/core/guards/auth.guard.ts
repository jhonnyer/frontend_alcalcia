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

  // Obtener el rol del usuario
  const userRole = tokenService.getUserRole();

  // Obtener el rol requerido de la ruta
  const requiredRole = route.data['role'] as string;

  // Si no hay rol requerido, solo verificar que esté logeado
  if (!requiredRole) {
    return true;
  }

  // Verificar si el rol del usuario coincide con el rol requerido
  // Considera que tu rol viene como "RESP", así que ajusta la comparación
  if (userRole !== requiredRole) {
    // Puedes redirigir a una página de acceso denegado
    // router.navigate(['/access-denied']);
    router.navigate(['/']);
    return false;
  }

  return true;
};

/*
  const token: string | unknown = inject(TokenService).getToken();

  if(!token){
    inject(Router).navigate(['/auth'])
  }
  inject(Router).navigate(['/home'])
  return true;
};
*/
