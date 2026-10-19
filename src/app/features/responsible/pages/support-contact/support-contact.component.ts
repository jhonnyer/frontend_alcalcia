import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IParametroNegocio } from '../../../../core/models/parametro-negocio.model';
import { ISoporteSuperAdmin } from '../../../../core/models/responsable.model';
import { ISecretaria } from '../../../../core/models/secretaria.model';
import { AlertService } from '../../../../core/services/alert.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ParametroNegocioService } from '../../../../core/services/parametro-negocio.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { TokenService } from '../../../../core/services/token.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-support-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './support-contact.component.html',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportContactComponent {
  private readonly parametroNegocioService = inject(ParametroNegocioService);
  private readonly responsibleService = inject(ResponsibleService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly alert = inject(AlertService);
  private readonly tokenService = inject(TokenService);

  loading = signal(true);
  loadErrors = signal<string[]>([]);
  parametros = signal<IParametroNegocio | null>(null);
  superAdmin = signal<ISoporteSuperAdmin | null>(null);
  activeSecretaryName = signal('');
  secretarias = signal<ISecretaria[]>([]);

  get institutionLabel(): string {
    const tipo = this.secretarias()[0]?.tipo;
    return tipo === 'D' ? 'Gobernación' : tipo === 'M' ? 'Alcaldía' : 'Institución';
  }

  get authorityLabel(): string {
    const tipo = this.secretarias()[0]?.tipo;
    return tipo === 'D' ? 'Gobernador o gobernadora' : tipo === 'M' ? 'Alcalde o alcaldesa' : 'Máxima autoridad';
  }

  get supportEmail(): string {
    return String(this.superAdmin()?.email ?? '').trim();
  }

  get supportPhone(): string {
    return String(this.superAdmin()?.telefono ?? '').trim();
  }

  get supportName(): string {
    const admin = this.superAdmin();
    if (!admin) return '';
    return `${admin.primerNombre ?? ''} ${admin.segundoNombre ?? ''} ${admin.primerApellido ?? ''} ${admin.segundoApellido ?? ''}`.replace(/\s+/g, ' ').trim();
  }

  get activeSecretaryLabel(): string {
    const byParametroId = this.parametros()?.idSecretariaFk;
    if (byParametroId != null) {
      const fromParametro = this.secretarias().find(secretaria => secretaria.idSecretaria === byParametroId)?.nombre;
      const parametroName = String(fromParametro ?? '').trim();
      if (parametroName) return this.toDisplayTitleCase(parametroName);
    }

    const sessionName = this.activeSecretaryName().trim();
    if (sessionName) return this.toDisplayTitleCase(sessionName);

    const activeId = this.tokenService.getActiveSecretaryId();
    const fromToken = this.tokenService
      .getAvailableSecretaries()
      .find(secretaria => secretaria.idSecretaria === activeId)?.nombre;
    const tokenName = String(fromToken ?? '').trim();
    if (tokenName) return this.toDisplayTitleCase(tokenName);

    return 'No configurada';
  }

  get correspondingSecretaryLabel(): string {
    const fromParametro = String(this.parametros()?.nombreSecretaria ?? '').trim();
    if (fromParametro) return this.toDisplayTitleCase(fromParametro);
    return this.activeSecretaryLabel;
  }

  get isSuperAdminProfile(): boolean {
    return this.normalizedRole === 'SUPERADMIN';
  }

  private get normalizedRole(): string {
    return String(this.tokenService.getUserRole() ?? '')
      .toLocaleUpperCase()
      .replace(/^ROLE_/, '')
      .trim();
  }

  get mayorName(): string {
    return String(this.parametros()?.nombreAlcalde ?? '').trim() || 'No configurado';
  }

  get cityHallName(): string {
    return String(this.parametros()?.nombreAlcaldia ?? '').trim() || 'No configurada';
  }

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Soporte administrativo');
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadErrors.set([]);
    this.parametros.set(null);
    this.secretarias.set([]);
    this.activeSecretaryName.set('');

    const activeId = this.tokenService.getActiveSecretaryId();
    let pending = activeId != null ? 2 : 1;
    const finish = () => {
      pending--;
      if (pending === 0) this.loading.set(false);
    };
    if (activeId != null) {
      const fromToken = this.tokenService
        .getAvailableSecretaries()
        .find(secretaria => secretaria.idSecretaria === activeId)?.nombre;
      const tokenName = String(fromToken ?? '').trim();
      if (tokenName) {
        this.activeSecretaryName.set(tokenName);
      }
    }

    if (activeId != null) {
      this.parametroNegocioService.getContext().pipe(timeout(45000), finalize(finish)).subscribe({
        next: (contexto) => {
          this.parametros.set(contexto.parametros);
          this.secretarias.set([contexto.secretaria]);
          this.activeSecretaryName.set(contexto.secretaria.nombre);
        },
        error: (error) => {
          console.error('Error al cargar los datos institucionales de soporte:', error);
          this.loadErrors.update(errors => [...errors, 'No se pudieron consultar los datos institucionales de la secretaría activa.']);
        }
      });
    }

    this.responsibleService.getSupportSuperAdmin().pipe(timeout(45000), finalize(finish)).subscribe({
      next: (responsable) => {
        this.superAdmin.set(responsable);
      },
      error: (error) => {
        console.error('Error al cargar soporte SuperAdmin:', error);
        this.superAdmin.set(null);
        this.loadErrors.update(errors => [...errors, 'No se pudo consultar el contacto de soporte. La consulta falló, tardó demasiado o no tienes permisos.']);
      }
    });
  }

  openMailClient(): void {
    const email = this.supportEmail;
    if (!email) {
      this.alert.warning('Correo no disponible', 'La secretaría activa no tiene correo institucional configurado.');
      return;
    }

    const secretaria = String(this.parametros()?.nombreSecretaria ?? '').trim() || 'Secretaría activa';
    const subject = encodeURIComponent(`Soporte - ${secretaria}`);
    const body = encodeURIComponent('Hola, requiero apoyo con la operación del sistema.');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  callSupport(): void {
    const phone = this.supportPhone;
    if (!phone) {
      this.alert.warning('Teléfono no disponible', 'La secretaría activa no tiene teléfono de soporte configurado.');
      return;
    }

    const sanitized = phone.replace(/[^0-9+]/g, '');
    if (!sanitized) {
      this.alert.warning('Teléfono inválido', 'El número de contacto configurado no es válido para llamada.');
      return;
    }

    window.location.href = `tel:${sanitized}`;
  }

  async copyValue(value: string, label: string): Promise<void> {
    const text = String(value ?? '').trim();
    if (!text) {
      this.alert.warning('Dato no disponible', `No hay ${label.toLowerCase()} para copiar.`);
      return;
    }

    if (!navigator?.clipboard?.writeText) {
      this.alert.info('Copiado manual', `Tu navegador no soporta copiado automático. Copia este valor: ${text}`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.alert.success('Copiado', `${label} copiado al portapapeles.`);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      this.alert.error('No se pudo copiar', `No fue posible copiar ${label.toLowerCase()}.`);
    }
  }

  private toDisplayTitleCase(value: string): string {
    const minorWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u']);
    const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
    if (!normalized) return '';

    return normalized
      .toLocaleLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index > 0 && minorWords.has(word)) return word;
        return word.charAt(0).toLocaleUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}
