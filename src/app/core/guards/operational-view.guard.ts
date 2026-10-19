import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const operationalViewGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const role = (tokenService.getUserRole() ?? '').trim().toUpperCase().replace(/^ROLE_/, '');
  return role === 'SUPERADMIN' ? router.createUrlTree(['/users']) : true;
};
