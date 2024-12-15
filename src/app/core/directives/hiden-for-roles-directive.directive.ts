import {
  Directive,
  inject,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { TokenService } from '../services/token.service';
import { PerfilUsuario } from '../models/responsable.model';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appHidenForRolesDirective]',
  standalone: true
})
export class HidenForRolesDirectiveDirective {

  @Input('appShowForRoles') allowedRoles?: PerfilUsuario[];

  private tokenService = inject(TokenService);
  private destroy$ = new Subject<void>();

  constructor(
    private viewContainerRef: ViewContainerRef,
    private templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    const checkAuthorization = () => {
      // Verificar si el usuario está autenticado
      const isLoggedIn = !this.tokenService.isTokenExpired();
      if (!isLoggedIn) {
        this.viewContainerRef.clear();
        return;
      }

      // Verificar rol y estado del usuario
      const userRole = this.tokenService.getUserRole();
      const userState = this.tokenService.getUserState();

      /*
      const isAuthorized =
        userState === 'A' && // Usuario activo
        this.allowedRoles?.some(role => role === userRole as PerfilUsuario);*/

      const isAuthorized =
        userState === 'A' && // Usuario activo
        userRole !== null &&
        this.allowedRoles?.includes(userRole as PerfilUsuario);

      // Renderizar o limpiar la vista según la autorización
      if (isAuthorized) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainerRef.clear();
      }
    };

    // Llamar inicialmente
    checkAuthorization();

    // Observar cambios en el token
    this.tokenService.tokenChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(checkAuthorization);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
