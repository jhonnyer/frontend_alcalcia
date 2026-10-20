import { Component, inject, OnInit, signal } from '@angular/core';
import { SearchService } from '../../../core/services/search.service';
import { PageTitleService } from '../../../core/services/pageTitle.service';
import { TokenService } from '../../../core/services/token.service';
import { Router, RouterLink } from '@angular/router';
import {
  CdkMenu,
  CdkMenuTrigger,
  CdkMenuItem,
  CdkMenuBar,
} from '@angular/cdk/menu';
import { MatIconModule } from '@angular/material/icon';
import { ISecretariaAcceso } from '../../../core/models/responseLogin.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { DOCUMENT, Location } from '@angular/common';
import { SecretariaAdminService } from '../../../core/services/secretaria-admin.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    CdkMenuBar,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkMenu,
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  public searchService = inject(SearchService);
  public pageTitleService = inject(PageTitleService);
  public tokenService = inject(TokenService);
  public route = inject(Router);
  public userRole = signal<string | null>(null);
  public secretarias: ISecretariaAcceso[] = [];
  public activeSecretaryId: number | null = null;
  public changingSecretary = false;
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);
  private readonly document = inject(DOCUMENT);
  private readonly location = inject(Location);
  private readonly secretariaAdmin = inject(SecretariaAdminService);
  private refreshingSecretaries = false;

  loginUser: boolean = false;

  searchTerm = this.searchService.getSearchTerm();

  roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERADMIN: 'Super Administrador',
    RESP: 'Responsable',
    USER: 'Usuario',
    BENEF: 'Beneficiario'
  };

  ngOnInit(): void {
    this.loginState();
    this.loadUserRole();
    this.secretarias = this.tokenService.getAvailableSecretaries();
    this.activeSecretaryId = this.tokenService.getActiveSecretaryId();
  }

  loginState(){
    // Primero verificar si el usuario está logueado (token no expirado)
    this.userRole.set(this.tokenService.getUserRole());
    this.loginUser = !this.tokenService.getToken();
  }

  logout(){
    this.tokenService.clearToken();
    this.route.navigate(['/auth']);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchService.updateSearchTerm(target.value);
  }

  private loadUserRole(): void {
    const role = this.tokenService.getUserRole(); // ejemplo: "ADMIN" o "RESP"
    this.userRole.set(role);
  }

  goHome(): void {
    this.route.navigate([this.userRole() === 'SUPERADMIN' ? '/users' : '/home']);
  }

  refreshSecretaries(): void {
    if (this.userRole() !== 'SUPERADMIN' || this.refreshingSecretaries) return;
    this.refreshingSecretaries = true;
    this.secretariaAdmin.getAll().pipe(
      timeout(45000),
      finalize(() => this.refreshingSecretaries = false)
    ).subscribe({
      next: secretarias => {
        this.secretarias = secretarias.filter(s => s.estado === 'A').map(s => ({
          idSecretaria: s.idSecretaria, nombre: s.nombre, codigo: s.codigo, rol: 'SUPERADMIN'
        }));
      },
      error: error => {
        console.error('No se pudieron actualizar las secretarías disponibles:', error);
        this.alert.error('No se pudieron actualizar las secretarías', 'Vuelve a abrir el selector para reintentar.');
      }
    });
  }

  async changeSecretary(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const requestedId = select.value === '' ? null : Number(select.value);
    select.value = this.activeSecretaryId === null ? '' : String(this.activeSecretaryId);
    if (this.changingSecretary || requestedId === this.activeSecretaryId) return;
    if (requestedId === null && this.userRole() !== 'SUPERADMIN') return;
    if (requestedId !== null && !this.secretarias.some(s => s.idSecretaria === requestedId)) {
      this.alert.error('Secretaría no válida', 'Selecciona una de las secretarías disponibles.');
      return;
    }
    this.changingSecretary = true;
    const confirmed = await this.alert.confirm(
      'Cambiar contexto',
      'Se recargará la vista para no mezclar datos entre secretarías. Los cambios sin guardar se perderán.',
      'Cambiar', 'Cancelar'
    );
    if (!confirmed) {
      this.changingSecretary = false;
      return;
    }
    const request = requestedId === null
      ? this.auth.enterGlobalContext()
      : this.auth.changeSecretary(requestedId);
    request.subscribe({
      next: response => {
        if (response.idSecretaria !== requestedId) {
          this.changingSecretary = false;
          this.alert.error('Contexto no confirmado', 'El servidor no confirmó el contexto solicitado.');
          return;
        }
        this.tokenService.saveLoginResponse(response);
        // Reiniciar las vistas y caches locales al cambiar el contexto de datos.
        const target = response.rol === 'SUPERADMIN' ? '/users' : '/home';
        this.document.location.href = this.location.prepareExternalUrl(target);
      },
      error: error => {
        console.error('No se pudo cambiar el contexto de secretaría:', error);
        this.changingSecretary = false;
        this.alert.error('No se pudo cambiar el contexto', 'Comprueba que la secretaría y tu acceso sigan activos.');
      }
    });
  }

  get activeSecretaryName(): string {
    return this.secretarias.find(secretaria => secretaria.idSecretaria === this.activeSecretaryId)?.nombre
      ?? 'Secretaría activa';
  }
}
