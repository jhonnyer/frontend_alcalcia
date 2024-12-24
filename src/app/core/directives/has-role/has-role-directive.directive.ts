import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { TokenService } from '../../services/token.service';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private tokenService: TokenService
  ) {}

  @Input() set hasRole(allowedRoles: string | string[]) {
    const userRole = this.tokenService.getUserRole();

    // Si no hay rol, no mostrar el elemento
    if (!userRole) {
      this.viewContainer.clear();
      return;
    }

    // Convertir el input a array si es un string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Mostrar o esconder basado en el rol
    if (roles.includes(userRole)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

}
