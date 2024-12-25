import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-inactive',
  standalone: true,
  imports: [],
  template: `
    <div class="container">
      <h2>Cuenta Inactiva</h2>
      <p>Su cuenta está actualmente inactiva.</p>
      <p>Por favor, contacte al administrador para solicitar la activación de su cuenta.</p>
      <button (click)="logout()">Cerrar Sesión</button>
    </div>
  `,
  styleUrl: './userInactive.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserInactiveComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
