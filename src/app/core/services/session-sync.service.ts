import { DOCUMENT, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { EMPTY, catchError, exhaustMap, filter, fromEvent, merge, tap, timer, timeout } from 'rxjs';
import { AlertService } from './alert.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class SessionSyncService {
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);
  private readonly alert = inject(AlertService);
  private readonly document = inject(DOCUMENT);
  private readonly location = inject(Location);

  monitor(destroyRef: DestroyRef): void {
    let connectionWarningShown = false;
    const renderedRole = this.tokens.getUserRole();
    const renderedState = this.tokens.getUserState();
    const renderedSecretary = this.tokens.getActiveSecretaryId();
    merge(
      timer(0, 60000),
      fromEvent(this.document, 'visibilitychange'),
      fromEvent(this.document.defaultView ?? this.document, 'focus'),
      this.router.events.pipe(filter(event => event instanceof NavigationEnd))
    ).pipe(
      filter(() => this.document.visibilityState !== 'hidden'
        && !!this.tokens.getToken() && !this.tokens.hasPendingSecretarySelection()),
      exhaustMap(() => {
        const token = this.tokens.getToken();
        return this.auth.getCurrentSession().pipe(
          timeout(15000),
          tap(response => {
            if (token !== this.tokens.getToken()) return;
            connectionWarningShown = false;
            const changed = response.rol !== renderedRole
              || response.estadoUser !== renderedState
              || response.idSecretaria !== renderedSecretary;
            this.tokens.saveLoginResponse(response);
            if (changed) {
              this.alert.info('Permisos actualizados', 'Tu acceso cambió. Se recargará la vista con los permisos actuales.');
              this.document.location.href = this.location.prepareExternalUrl(
                response.rol === 'SUPERADMIN' ? '/users' : '/home'
              );
            }
          }),
          catchError((error: unknown) => {
            if (token !== this.tokens.getToken()) return EMPTY;
            console.error('No se pudo actualizar la sesión:', error);
            if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
              this.tokens.clearToken();
              this.alert.warning('Acceso actualizado', 'Tu sesión o vinculación ya no está activa. Inicia sesión para consultar tus accesos disponibles.');
              void this.router.navigate(['/auth']);
            } else if (!connectionWarningShown) {
              connectionWarningShown = true;
              this.alert.warning('No se pudieron verificar los permisos', 'Comprueba la conexión. Se reintentará automáticamente.');
            }
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(destroyRef)
    ).subscribe();
  }
}
