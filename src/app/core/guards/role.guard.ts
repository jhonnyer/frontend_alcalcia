import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { inject } from '@angular/core';
import { PerfilUsuario } from '../models/responsable.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const requiredRole = route.data['role'];
  const currentRole = tokenService.getUserRole();

  if (!currentRole || !requiredRole) {
    router.navigate(['/access-denied']);
    return false;
  }

  if (Array.isArray(requiredRole)) {
    if (!requiredRole.includes(currentRole)) {
      router.navigate(['/access-denied']);
      return false;
    }
  } else if (requiredRole !== currentRole) {
    router.navigate(['/access-denied']);
    return false;
  }

  return true;
};
/*
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Obtener el rol requerido de la ruta
  const requiredRole = route.data['role'] as PerfilUsuario;
  console.log('Role Usuario: ', requiredRole);

  // Obtener el rol del usuario actual
  const userRole = tokenService.getUserRole();

  // Verificar si el rol del usuario coincide con el rol requerido
  if (!requiredRole || userRole !== requiredRole) {
    router.navigate(['/access-denied']);
    return false;
  }

  return true;
*/
