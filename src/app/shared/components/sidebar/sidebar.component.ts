import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, filter, map, merge, of, Subject, switchMap, timeout } from 'rxjs';
import { ParametroNegocioService } from '../../../core/services/parametro-negocio.service';
import { DefaultLogoCache } from '../../../core/services/default-logo.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TokenService } from '../../../core/services/token.service';
import { ListHomeComponent } from './components/list-home/list-home.component';
import { ListNucleoComponent } from './components/list-nucleo/list-nucleo.component';
import { ListProceedingsComponent } from './components/list-proceedings/list-proceedings.component';
import { ListResponsibleComponent } from './components/list-responsible/list-responsible.component';
import { ListProjectsComponent } from "./components/list-projects/list-projects.component";

import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgIf} from '@angular/common'

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ListHomeComponent,
    ListNucleoComponent,
    ListProceedingsComponent,
    ListResponsibleComponent,
    ListProjectsComponent,
    MatIconModule,
    NgClass,
    NgIf,
    RouterLink,
    RouterLinkActive
],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private readonly parametros = inject(ParametroNegocioService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retry = new Subject<void>();
  private readonly defaultLogo = inject(DefaultLogoCache);
  readonly institutionName = signal('Cargando institución...');
  readonly institutionError = signal('');
  readonly institutionLogo = signal('');
  readonly logoError = signal(false);

  private releaseLogo(): void {
    const url = this.institutionLogo();
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    this.institutionLogo.set('');
  }

  onLogoError(): void {
    this.releaseLogo();
    this.logoError.set(true);
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.releaseLogo());
    const activeSecretary$ = this.tokenService.tokenChanges$.pipe(
      debounceTime(0),
      map(() => this.tokenService.getActiveSecretaryId()),
      distinctUntilChanged(),
    );
    merge(
      activeSecretary$,
      this.parametros.changes$.pipe(filter(id => id === this.tokenService.getActiveSecretaryId())),
      this.retry.pipe(map(() => this.tokenService.getActiveSecretaryId())),
    ).pipe(
      switchMap(id => {
        this.releaseLogo();
        this.logoError.set(false);
        this.institutionError.set('');
        this.institutionName.set(id ? 'Cargando institución...' : 'Sin secretaría activa');
        if (!id) return of(null);
        return this.parametros.getActive().pipe(
          timeout(45000),
          map(parametros => {
            if (parametros.idSecretariaFk !== id) {
              throw new Error('La configuración institucional no corresponde a la secretaría activa.');
            }
            return parametros;
          }),
          switchMap(parametros => {
            const nombre = parametros.nombreAlcaldia?.trim().replace(/\s+/g, ' ') || null;
            this.institutionName.set(nombre || 'Institución no disponible');
            if (!nombre) {
              this.institutionError.set('Configura el nombre institucional en los parámetros de la secretaría.');
            }
            if (parametros.logoInstitucional?.trim()) {
              return of(parametros.logoInstitucional.trim());
            }
            return this.defaultLogo.image$.pipe(
              map(blob => URL.createObjectURL(blob)),
              catchError(error => {
                console.error('No se pudo cargar el logo institucional del menú:', error);
                this.logoError.set(true);
                return of('');
              }),
            );
          }),
          catchError((error: unknown) => {
            console.error('No se pudo cargar el nombre institucional del menú:', error);
            this.institutionName.set('Institución no disponible');
            this.institutionError.set(error instanceof HttpErrorResponse && error.status === 404
              ? 'Configura los parámetros institucionales de la secretaría.'
              : 'No se pudo consultar el nombre institucional. Puedes reintentar.');
            return of(null);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(logo => this.institutionLogo.set(logo || ''));
  }

  retryInstitution(): void {
    this.retry.next();
  }

  get isSuperAdmin(): boolean {
    return (this.tokenService.getUserRole() ?? '').trim().toUpperCase().replace(/^ROLE_/, '') === 'SUPERADMIN';
  }

  isAnimating = false;
  /** Abierto/cerrado en móviles */
  @Input() open = false;
  /** Colapsado/expandido en desktop (xl+) */
  @Input() collapsed = false;

  /** Emite cuando se cierra en móvil (para que el padre actualice el estado) */
  @Output() closed = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if ('open' in changes || 'collapsed' in changes) {
      this.isAnimating = true;              // activa bloqueo de clicks
      // fallback por si el navegador no dispara transitionend (poco probable):
      setTimeout(() => (this.isAnimating = false), 400);
    }
  }

  close() {
    this.closed.emit();
  }

  logout() {
    this.tokenService.clearToken();
    this.closed.emit();
    this.router.navigate(['/auth']);
  }
}
