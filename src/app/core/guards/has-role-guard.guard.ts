import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const hasRoleGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Obtener los roles permitidos de los datos de la ruta
  const allowedRoles = route.data?.['allowedRoles'] as string[];

  // Obtener el rol del usuario
  const userRole = tokenService.getUserRole();

  console.log('Rol del usuario:', userRole);
  console.log('Rol del ruta:', allowedRoles);

  if (!userRole || !allowedRoles) {
    console.log('No hay rol de usuario o roles permitidos');
    router.navigate(['/no-autorizado']);
    return false;
  }

  // Verificar si el rol del usuario está en los roles permitidos
  if (allowedRoles.includes(userRole)) {
    return true;
  }

  console.log('Usuario no tiene el rol requerido');
  router.navigate(['/no-autorizado']);
  return false;
};
