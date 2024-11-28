import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

const CHECK_TOKEN = new HttpContextToken<boolean>(() => false);

export function checkToken() {
  return new HttpContext().set(CHECK_TOKEN, true);
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const accessToken = tokenService.getToken();

  // Verificar si hay un token disponible
  if (accessToken) {
    // Clonar la solicitud y agregar el encabezado de autorización
    const authRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // Continuar con la solicitud modificada
    return next(authRequest);
  }

  // Si no hay token, continuar con la solicitud original
  return next(req);

  /*
  if (req.context.get(CHECK_TOKEN)) {
    const tokenService = inject(TokenService);
    const accessToken = tokenService.getToken();
    if (accessToken) {
      const authRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
      });
      return next(authRequest);
    }
    return next(req);
  }
  return next(req);*/
};
