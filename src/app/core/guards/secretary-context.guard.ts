import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { AlertService } from '../services/alert.service';

export const secretaryContextGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  if (tokenService.getActiveSecretaryId() !== null) return true;
  inject(AlertService).warning(
    'Selecciona una secretaría',
    'Usa el selector de contexto de datos para consultar información de una secretaría.'
  );
  return inject(Router).createUrlTree(['/users']);
};
