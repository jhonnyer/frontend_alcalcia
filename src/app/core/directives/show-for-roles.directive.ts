import {
  Directive,
  inject,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef, } from '@angular/core';

import { TokenService } from '../services/token.service';
import { PerfilUsuario } from '../models/responsable.model';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appShowForRoles]',
  standalone: true
})
export class ShowForRolesDirective implements OnInit, OnDestroy  {
  @Input('appShowForRoles') allowedRoles?: PerfilUsuario[];

  private tokenService = inject(TokenService);

  // Subject para manejar la destrucción de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private viewContainerRef: ViewContainerRef,
    private templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    // Método para verificar y renderizar
    const checkAuthorization = () => {
      // Primero verificar si el usuario está logueado (token no expirado)
      const isLoggedIn = !this.tokenService.isTokenExpired();

      // Si no está logueado, no renderizar nada
      if (!isLoggedIn) {
        this.viewContainerRef.clear();
        return;
      }

      // Get current user role and state from TokenService
      const userRole = this.tokenService.getUserRole();
      const userState = this.tokenService.getUserState();

      // Check if user is active and has an allowed role
      const isAuthorized =
        userState === 'A' && // User is active
        this.allowedRoles?.some(role => role === userRole);

      // Render or clear the view based on authorization revisar
      if (isAuthorized) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainerRef.clear();
      }
    };

    // Llamar inicialmente
    checkAuthorization();

    // Observar cambios en el token (puedes implementar esto en tu TokenService)
    this.tokenService.tokenChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        checkAuthorization();
      });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }
}
