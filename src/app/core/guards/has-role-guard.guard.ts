import { CanMatchFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { inject } from '@angular/core';

export const hasRoleGuardGuard: CanMatchFn = (route, segments) => {

    const tokenService = inject(TokenService);
    const router = inject(Router);




  return true;
};
