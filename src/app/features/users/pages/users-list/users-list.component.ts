import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecretariaAdminService } from '../../../../core/services/secretaria-admin.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { ICoberturaDepartamento, ICoberturaMunicipio, ISecretaria } from '../../../../core/models/secretaria.model';
import { IResponsable } from '../../../../core/models/responsable.model';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { MatIconModule } from '@angular/material/icon';
import { TokenService } from '../../../../core/services/token.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ParametroNegocioService } from '../../../../core/services/parametro-negocio.service';
import { IParametroNegocio } from '../../../../core/models/parametro-negocio.model';
import { SecretaryCreateModalComponent, CreateSecretaryModalPayload } from '../../components/secretary-create-modal/secretary-create-modal.component';
import { SecretaryParametersModalComponent } from '../../components/secretary-parameters-modal/secretary-parameters-modal.component';
import { ResponsibleUpdateComponent } from '../../../responsible/pages/responsible-update/responsible-update.component';
import { MunicipioService } from '../../../../core/services/municipio.service';
import { IMunicipio } from '../../../../core/models/municipio.model';
import { DepartamentoService } from '../../../../core/services/departamento.service';
import { IDepartamento } from '../../../../core/models/departamento.model';
import { finalize, forkJoin, timeout } from 'rxjs';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    ReactiveFormsModule,
    SecretaryCreateModalComponent,
    SecretaryParametersModalComponent,
    ResponsibleUpdateComponent,
  ],
  templateUrl: `./users-list.component.html`,
  styles: `
    .secretaries-table { min-width: 34rem; }
    .secretaries-table .secretary-name { width: 14rem; }
    .expandable-name { width: 11rem; max-width: 100%; }
    .expandable-name summary { display: flex; align-items: baseline; gap: 0.5rem; list-style: none; cursor: pointer; }
    .expandable-name summary::-webkit-details-marker { display: none; }
    .expandable-name summary::before {
      content: '';
      flex: 0 0 auto;
      width: 0.4rem;
      height: 0.4rem;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(-45deg);
    }
    .expandable-name[open] summary::before { transform: rotate(45deg); }
    .expandable-name summary span { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .expandable-name[open] summary span { white-space: normal; overflow-wrap: anywhere; }
    .municipalities-table { min-width: 0; table-layout: fixed; }
    .municipalities-table th, .municipalities-table td { padding: 0.5rem; }
    .municipalities-table .municipality-state { width: 5rem; text-align: center; }
    .municipalities-table .municipality-action { width: 6rem; text-align: center; }
    .municipalities-table .expandable-name { width: 100%; }
    @media (max-width: 640px) {
      .secretaries-table { min-width: 30rem; }
      .secretaries-table .secretary-name { width: 11rem; }
      .expandable-name { width: 9rem; }
      .municipalities-table { font-size: 0.75rem; }
      .municipalities-table .municipality-state { width: 4.5rem; }
      .municipalities-table .municipality-action { width: 5.5rem; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent implements OnInit {
  private readonly secretariaAdminService = inject(SecretariaAdminService);
  private readonly responsibleService = inject(ResponsibleService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly tokenService = inject(TokenService);
  private readonly alert = inject(AlertService);
  private readonly parametroNegocioService = inject(ParametroNegocioService);
  private readonly municipioService = inject(MunicipioService);
  private readonly departamentoService = inject(DepartamentoService);

  secretarias = signal<ISecretaria[]>([]);
  departamentos = signal<IDepartamento[]>([]);
  municipios = signal<IMunicipio[]>([]);
  responsables = signal<IResponsable[]>([]);
  loading = signal(true);
  loadErrors = signal<string[]>([]);
  secretariaSearch = signal('');
  usuarioSearch = signal('');
  creatingSecretary = signal(false);
  secretaryModalOpen = signal(false);
  activeSecretaryName = signal('');
  editingActiveSecretary = signal(false);
  parameterModalOpen = signal(false);
  loadingParameters = signal(false);
  savingParameters = signal(false);
  secretariaPageIndex = signal(0);
  secretariaPageSize = signal(6);
  usuarioPageIndex = signal(0);
  usuarioPageSize = signal(5);
  selectedSecretaryForParameters = signal<ISecretaria | null>(null);
  selectedSecretaryForCoverage = signal<ISecretaria | null>(null);
  coverageModalOpen = signal(false);
  loadingCoverage = signal(false);
  savingCoverage = signal(false);
  coberturaDepartamental = signal<ICoberturaDepartamento[]>([]);
  coberturaMunicipal = signal<ICoberturaMunicipio[]>([]);
  departamentoToAssign = signal<number | null>(null);
  municipioToAssign = signal<number | null>(null);
  coverageDepartamentoFilter = signal<number | null>(null);
  coverageDepartamentoInput = signal('');
  coverageMunicipioInput = signal('');
  showCoverageDepartamentoDropdown = false;
  showCoverageMunicipioDropdown = false;
  coverageDepartamentoHighlightIndex = signal(0);
  coverageMunicipioHighlightIndex = signal(0);
  coverageSelectedTab = signal<'departamentos' | 'municipios'>('departamentos');
  currentParameters = signal<IParametroNegocio | null>(null);
  activeTab = signal<'secretarias' | 'usuarios'>('secretarias');
  userFormModalOpen = signal(false);
  userFormResponsableId = signal<number | null>(null);
  deletingSecretariaId = signal<number | null>(null);
  updatingSecretariaStatusId = signal<number | null>(null);
  readonly hasSecretaryContext = this.tokenService.getActiveSecretaryId() !== null;

  activeSecretaryForm = this.fb.group({
    nombre: ['', [Validators.required]]
  });

  filteredSecretarias = computed(() => {
    const query = this.normalizeSearchText(this.secretariaSearch());
    const activeSecretaryId = this.tokenService.getActiveSecretaryId();
    const visibleSecretarias = this.isSuperAdmin()
      ? this.secretarias()
      : this.secretarias().filter(secretaria => secretaria.idSecretaria === activeSecretaryId);
    return visibleSecretarias.filter(secretaria => {
      const text = this.normalizeSearchText(`${secretaria.idSecretaria} ${secretaria.nombre} ${secretaria.codigo} ${secretaria.estado}`);
      return !query || text.includes(query);
    });
  });

  secretariaTotalPages = computed(() => {
    const total = this.filteredSecretarias().length;
    return Math.max(1, Math.ceil(total / this.secretariaPageSize()));
  });

  paginatedSecretarias = computed(() => {
    const pageSize = this.secretariaPageSize();
    const safePageIndex = Math.min(this.secretariaPageIndex(), this.secretariaTotalPages() - 1);
    const start = safePageIndex * pageSize;
    return this.filteredSecretarias().slice(start, start + pageSize);
  });

  filteredResponsables = computed(() => {
    const query = this.normalizeSearchText(this.usuarioSearch());
    return this.responsables().filter(responsable => {
      const text = this.normalizeSearchText(`${responsable.idResponsable} ${responsable.primerNombre} ${responsable.segundoNombre} ${responsable.primerApellido} ${responsable.segundoApellido} ${responsable.usuario} ${responsable.numeroIdentificacion} ${responsable.perfilUsuario} ${responsable.estado}`);
      return !query || text.includes(query);
    });
  });

  visibleResponsables = computed(() => this.filteredResponsables().filter(responsable => responsable.perfilUsuario !== 'SUPERADMIN'));

  usuarioTotalPages = computed(() => {
    const total = this.visibleResponsables().length;
    return Math.max(1, Math.ceil(total / this.usuarioPageSize()));
  });

  paginatedResponsables = computed(() => {
    const pageSize = this.usuarioPageSize();
    const safePageIndex = Math.min(this.usuarioPageIndex(), this.usuarioTotalPages() - 1);
    const start = safePageIndex * pageSize;
    return this.visibleResponsables().slice(start, start + pageSize);
  });

  readonly isSuperAdmin = computed(() => {
    const role = (this.tokenService.getUserRole() ?? '').trim().replace(/^ROLE_/i, '');
    return this.normalizeSearchText(role) === 'superadmin';
  });

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Gestión administrativa');
    this.loadData();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.coverage-dropdown-departamento')) {
      this.showCoverageDepartamentoDropdown = false;
    }
    if (!target.closest('.coverage-dropdown-municipio')) {
      this.showCoverageMunicipioDropdown = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    void this.closeCoverageModalWithConfirm();
  }

  private async closeCoverageModalWithConfirm(): Promise<void> {
    if (!this.coverageModalOpen()) return;
    if (this.savingCoverage()) return;

    const confirmed = await this.alert.confirm(
      'Cerrar cobertura municipal',
      'Hay acciones en curso en esta vista. ¿Deseas cerrar el modal de cobertura?',
      'Cerrar',
      'Seguir aquí'
    );
    if (!confirmed) return;

    this.closeCoverageModal();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadErrors.set([]);
    let pending = this.hasSecretaryContext ? 4 : 3;
    if (!this.hasSecretaryContext) this.responsables.set([]);
    const finish = () => {
      pending--;
      if (pending === 0) this.loading.set(false);
    };
    this.departamentoService.getAll().pipe(timeout(45000), finalize(finish)).subscribe({
      next: departamentos => this.departamentos.set(departamentos),
      error: error => {
        console.error('Error al cargar departamentos:', error);
        this.loadErrors.update(errors => [...errors, 'No se pudieron cargar los departamentos.']);
      }
    });

    this.municipioService.getAll().pipe(timeout(45000), finalize(finish)).subscribe({
      next: municipios => this.municipios.set(municipios),
      error: error => {
        console.error('Error al cargar municipios:', error);
        this.loadErrors.update(errors => [...errors, 'No se pudieron cargar los municipios.']);
      }
    });

    this.secretariaAdminService.getAll().pipe(timeout(45000), finalize(finish)).subscribe({
      next: secretarias => {
        this.secretarias.set(secretarias);
        const activeId = this.tokenService.getActiveSecretaryId();
        const active = secretarias.find(secretaria => secretaria.idSecretaria === activeId);
        if (active) {
          this.activeSecretaryName.set(active.nombre);
          this.activeSecretaryForm.patchValue({ nombre: active.nombre });
        }
      },
      error: error => {
        console.error('Error al cargar secretarías:', error);
        this.loadErrors.update(errors => [...errors, 'No se pudieron cargar las secretarías.']);
      }
    });
    if (this.hasSecretaryContext) this.responsibleService.getAll().pipe(timeout(45000), finalize(finish)).subscribe({
      next: responsables => {
        this.responsables.set(responsables);
      },
      error: error => {
        console.error('Error al cargar usuarios:', error);
        this.loadErrors.update(errors => [...errors, 'No se pudieron cargar los usuarios.']);
      }
    });
  }

  goToUsers(): void {
    this.router.navigate(['/resposibles']);
  }

  goToNewUser(): void {
    this.userFormResponsableId.set(null);
    this.userFormModalOpen.set(true);
  }

  editUser(idResponsable: number): void {
    this.userFormResponsableId.set(idResponsable);
    this.userFormModalOpen.set(true);
  }

  closeUserFormModal(): void {
    this.userFormModalOpen.set(false);
    this.userFormResponsableId.set(null);
  }

  onUserSaved(): void {
    this.closeUserFormModal();
    this.loadData();
  }

  async createSecretary(payload: CreateSecretaryModalPayload): Promise<void> {
    if (this.creatingSecretary()) return;
    if (!this.isSuperAdmin()) {
      this.alert.warning('Permiso requerido', 'Solo un usuario SuperAdmin puede crear secretarías.');
      return;
    }

    const confirmed = await this.alert.confirm(
      'Crear secretaría',
      `¿Deseas crear la secretaría "${payload.secretaria.nombre}"? Se creará activa por defecto.`,
      'Crear',
      'Cancelar'
    );
    if (!confirmed || this.creatingSecretary()) return;

    this.creatingSecretary.set(true);
    this.secretariaAdminService.create({
      ...payload.secretaria,
      parametros: payload.parametros,
      admin: payload.admin,
    }).subscribe({
      next: secretaria => {
        this.secretarias.update(secretarias => [...secretarias, secretaria]);
        this.creatingSecretary.set(false);
        this.secretaryModalOpen.set(false);
        this.alert.success('Operación exitosa', 'Secretaría, asignaciones territoriales, parámetros institucionales y administrador creados correctamente.');
        this.loadData();
      },
      error: error => {
        console.error('Error al crear secretaría:', error);
        this.creatingSecretary.set(false);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo crear la secretaría');
      }
    });
  }

  clearSecretariaSearch(): void {
    this.secretariaSearch.set('');
    this.secretariaPageIndex.set(0);
  }

  updateSecretariaSearch(event: Event): void {
    this.secretariaSearch.set((event.target as HTMLInputElement).value);
    this.secretariaPageIndex.set(0);
  }

  onSecretariaPageSizeChange(event: Event): void {
    const nextSize = Number((event.target as HTMLSelectElement).value);
    this.secretariaPageSize.set(Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 6);
    this.secretariaPageIndex.set(0);
  }

  previousSecretariaPage(): void {
    if (this.secretariaPageIndex() <= 0) return;
    this.secretariaPageIndex.update(v => v - 1);
  }

  nextSecretariaPage(): void {
    if (this.secretariaPageIndex() >= this.secretariaTotalPages() - 1) return;
    this.secretariaPageIndex.update(v => v + 1);
  }

  async toggleSecretaryStatus(secretaria: ISecretaria): Promise<void> {
    if (this.updatingSecretariaStatusId() !== null) return;
    if (!this.isSuperAdmin()) {
      this.alert.warning('Permiso requerido', 'Solo un usuario SuperAdmin puede activar o inactivar secretarías.');
      return;
    }

    if (this.isActiveSecretary(secretaria)) {
      this.alert.warning('Operación no permitida', 'No puedes cambiar el estado de la secretaría activa de tu sesión.');
      return;
    }

    const willActivate = secretaria.estado !== 'A';
    const actionText = willActivate ? 'activar' : 'inactivar';
    const nextStatus: 'A' | 'I' = willActivate ? 'A' : 'I';

    const firstConfirm = await this.alert.confirm(
      `${willActivate ? 'Activar' : 'Inactivar'} secretaría`,
      willActivate
        ? `Vas a activar la secretaría "${secretaria.nombre}". Los responsables vinculados podrán volver a operar si su cuenta y membresía están activas.`
        : `Vas a inactivar la secretaría "${secretaria.nombre}". Esta acción no elimina datos: solo bloqueará el acceso operativo de esa secretaría hasta que se reactive.`,
      'Continuar',
      'Cancelar'
    );
    if (!firstConfirm) return;

    const secondConfirm = await this.alert.confirm(
      'Confirmación final',
      `¿Confirmas ${actionText} "${secretaria.nombre}"?`,
      `Sí, ${actionText}`,
      'Volver'
    );
    if (!secondConfirm || this.updatingSecretariaStatusId() !== null) return;

    this.updatingSecretariaStatusId.set(secretaria.idSecretaria);
    this.secretariaAdminService.updateStatus(secretaria.idSecretaria, nextStatus).subscribe({
      next: secretariaActualizada => {
        this.updatingSecretariaStatusId.set(null);
        this.secretarias.update(items => items.map(item =>
          item.idSecretaria === secretaria.idSecretaria
            ? { ...item, ...secretariaActualizada }
            : item
        ));
        this.alert.success('Operación exitosa', `Secretaría ${willActivate ? 'activada' : 'inactivada'} correctamente.`);
      },
      error: error => {
        this.updatingSecretariaStatusId.set(null);
        console.error(`Error al ${actionText} secretaría:`, error);
        this.alert.error(
          'Operación fallida',
          error?.error?.mensaje || error?.error || `No se pudo ${actionText} la secretaría. Verifica las restricciones de negocio e inténtalo nuevamente.`
        );
      }
    });
  }

  async deleteSecretary(secretaria: ISecretaria): Promise<void> {
    if (this.deletingSecretariaId() !== null) return;
    if (!this.isSuperAdmin()) {
      this.alert.warning('Permiso requerido', 'Solo un usuario SuperAdmin puede eliminar secretarías.');
      return;
    }

    if (this.isActiveSecretary(secretaria)) {
      this.alert.warning('Operación no permitida', 'No puedes eliminar la secretaría activa de tu sesión.');
      return;
    }

    const firstConfirm = await this.alert.confirm(
      'Eliminar secretaría',
      `Vas a eliminar la secretaría "${secretaria.nombre}". Solo se permite si no tiene datos operativos asociados (proyectos, categorías, productos, paquetes, actas o beneficiarios en proyectos). Se eliminarán sus parámetros, coberturas, consecutivo y vinculaciones; los beneficiarios y usuarios se conservan, eliminando solo la relación con esta secretaría. Esta acción es irreversible.`,
      'Continuar',
      'Cancelar'
    );
    if (!firstConfirm) return;

    const secondConfirm = await this.alert.confirm(
      'Confirmación final',
      `¿Confirmas eliminar definitivamente "${secretaria.nombre}"?`,
      'Eliminar definitivamente',
      'Volver'
    );
    if (!secondConfirm || this.deletingSecretariaId() !== null) return;

    this.deletingSecretariaId.set(secretaria.idSecretaria);
    this.secretariaAdminService.delete(secretaria.idSecretaria).subscribe({
      next: () => {
        this.deletingSecretariaId.set(null);
        this.secretarias.update(items => items.filter(item => item.idSecretaria !== secretaria.idSecretaria));
        this.alert.success('Operación exitosa', 'Secretaría eliminada correctamente.');
      },
      error: error => {
        this.deletingSecretariaId.set(null);
        console.error('Error al eliminar secretaría:', error);
        this.alert.error(
          'Operación fallida',
          error?.error?.mensaje || error?.error || 'No se pudo eliminar. Verifica que la secretaría no tenga datos operativos asociados.'
        );
      }
    });
  }

  clearUsuarioSearch(): void {
    this.usuarioSearch.set('');
    this.usuarioPageIndex.set(0);
  }

  updateUsuarioSearch(event: Event): void {
    this.usuarioSearch.set((event.target as HTMLInputElement).value);
    this.usuarioPageIndex.set(0);
  }

  onUsuarioPageSizeChange(event: Event): void {
    const nextSize = Number((event.target as HTMLSelectElement).value);
    this.usuarioPageSize.set(Number.isFinite(nextSize) && nextSize >= 5 ? nextSize : 5);
    this.usuarioPageIndex.set(0);
  }

  previousUsuarioPage(): void {
    if (this.usuarioPageIndex() <= 0) return;
    this.usuarioPageIndex.update(v => v - 1);
  }

  nextUsuarioPage(): void {
    if (this.usuarioPageIndex() >= this.usuarioTotalPages() - 1) return;
    this.usuarioPageIndex.update(v => v + 1);
  }

  openSecretaryModal(): void {
    if (!this.isSuperAdmin()) {
      this.alert.warning('Permiso requerido', 'Solo un usuario SuperAdmin puede crear secretarías.');
      return;
    }
    this.secretaryModalOpen.set(true);
  }

  closeSecretaryModal(): void {
    if (!this.creatingSecretary()) {
      this.secretaryModalOpen.set(false);
    }
  }

  closeParameterModal(): void {
    if (this.savingParameters()) return;
    this.parameterModalOpen.set(false);
    this.selectedSecretaryForParameters.set(null);
    this.currentParameters.set(null);
  }

  openCoverageModal(secretaria: ISecretaria): void {
    if (!this.isSuperAdmin() && !this.isActiveSecretary(secretaria)) {
      this.alert.warning('Permiso requerido', 'Solo puedes gestionar la cobertura de tu secretaría activa.');
      return;
    }
    this.selectedSecretaryForCoverage.set(secretaria);
    this.coberturaDepartamental.set([]);
    this.coberturaMunicipal.set([]);
    this.coverageModalOpen.set(true);
    this.departamentoToAssign.set(null);
    this.municipioToAssign.set(null);
    this.coverageDepartamentoFilter.set(null);
    this.coverageDepartamentoInput.set('');
    this.coverageMunicipioInput.set('');
    this.showCoverageDepartamentoDropdown = false;
    this.showCoverageMunicipioDropdown = false;
    this.coverageSelectedTab.set(secretaria.tipo === 'M' ? 'municipios' : 'departamentos');
    this.loadCoverage(secretaria.idSecretaria);
  }

  closeCoverageModal(): void {
    if (this.savingCoverage()) return;
    this.coverageModalOpen.set(false);
    this.selectedSecretaryForCoverage.set(null);
    this.coberturaDepartamental.set([]);
    this.coberturaMunicipal.set([]);
    this.departamentoToAssign.set(null);
    this.municipioToAssign.set(null);
    this.coverageDepartamentoFilter.set(null);
    this.coverageDepartamentoInput.set('');
    this.coverageMunicipioInput.set('');
    this.showCoverageDepartamentoDropdown = false;
    this.showCoverageMunicipioDropdown = false;
    this.coverageSelectedTab.set('departamentos');
  }

  toggleCoverageDepartamentoDropdown(): void {
    this.showCoverageDepartamentoDropdown = !this.showCoverageDepartamentoDropdown;
    if (this.showCoverageDepartamentoDropdown) {
      this.showCoverageMunicipioDropdown = false;
      this.coverageDepartamentoHighlightIndex.set(0);
    }
  }

  toggleCoverageMunicipioDropdown(): void {
    if (this.loadingCoverage() || !this.coverageDepartamentoActivo()) return;
    this.showCoverageMunicipioDropdown = !this.showCoverageMunicipioDropdown;
    if (this.showCoverageMunicipioDropdown) {
      this.showCoverageDepartamentoDropdown = false;
      this.coverageMunicipioHighlightIndex.set(0);
    }
  }

  selectCoverageDepartamento(idDepartamento: number, nombre: string): void {
    this.coverageDepartamentoFilter.set(idDepartamento);
    this.departamentoToAssign.set(idDepartamento);
    this.coverageDepartamentoInput.set(nombre);
    this.coverageMunicipioInput.set('');
    this.municipioToAssign.set(null);
    this.showCoverageDepartamentoDropdown = false;
    this.showCoverageMunicipioDropdown = false;
    this.coverageDepartamentoHighlightIndex.set(0);
    this.coverageMunicipioHighlightIndex.set(0);
  }

  selectCoverageMunicipio(idMunicipio: number, nombre: string): void {
    this.municipioToAssign.set(idMunicipio);
    this.coverageMunicipioInput.set(nombre);
    this.showCoverageMunicipioDropdown = false;
    this.coverageMunicipioHighlightIndex.set(0);
  }

  onCoverageDepartamentoKeydown(event: KeyboardEvent): void {
    const items = this.availableDepartamentosForCoverage();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.showCoverageDepartamentoDropdown) {
        this.showCoverageDepartamentoDropdown = true;
      }
      if (!items.length) return;
      const next = (this.coverageDepartamentoHighlightIndex() + 1) % items.length;
      this.coverageDepartamentoHighlightIndex.set(next);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.showCoverageDepartamentoDropdown) {
        this.showCoverageDepartamentoDropdown = true;
      }
      if (!items.length) return;
      const prev = (this.coverageDepartamentoHighlightIndex() - 1 + items.length) % items.length;
      this.coverageDepartamentoHighlightIndex.set(prev);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!this.showCoverageDepartamentoDropdown) {
        this.showCoverageDepartamentoDropdown = true;
        return;
      }
      const selected = items[this.coverageDepartamentoHighlightIndex()];
      if (selected) {
        this.selectCoverageDepartamento(selected.idDepartamento, selected.nombre);
      }
      return;
    }

    if (event.key === 'Escape') {
      this.showCoverageDepartamentoDropdown = false;
    }
  }

  onCoverageMunicipioKeydown(event: KeyboardEvent): void {
    if (this.loadingCoverage() || !this.coverageDepartamentoActivo()) return;
    const items = this.availableMunicipiosForCoverage();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.showCoverageMunicipioDropdown) {
        this.showCoverageMunicipioDropdown = true;
      }
      if (!items.length) return;
      const next = (this.coverageMunicipioHighlightIndex() + 1) % items.length;
      this.coverageMunicipioHighlightIndex.set(next);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.showCoverageMunicipioDropdown) {
        this.showCoverageMunicipioDropdown = true;
      }
      if (!items.length) return;
      const prev = (this.coverageMunicipioHighlightIndex() - 1 + items.length) % items.length;
      this.coverageMunicipioHighlightIndex.set(prev);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!this.showCoverageMunicipioDropdown) {
        this.showCoverageMunicipioDropdown = true;
        return;
      }
      const selected = items[this.coverageMunicipioHighlightIndex()];
      if (selected) {
        this.selectCoverageMunicipio(selected.idMunicipio, selected.nombre);
      }
      return;
    }

    if (event.key === 'Escape') {
      this.showCoverageMunicipioDropdown = false;
    }
  }

  setCoverageTab(tab: 'departamentos' | 'municipios'): void {
    this.coverageSelectedTab.set(tab);
  }

  private syncCoverageSelectedTab(preferred?: 'departamentos' | 'municipios'): void {
    if (this.coverageTipo() === 'M') {
      this.coverageSelectedTab.set('municipios');
      return;
    }
    const depCount = this.coberturaDepartamental().filter(c => c.estado === 'A').length;
    const munCount = this.coberturaMunicipal().filter(c => c.estado === 'A').length;

    if (preferred === 'municipios' && munCount > 0) {
      this.coverageSelectedTab.set('municipios');
      return;
    }
    if (preferred === 'departamentos' && depCount > 0) {
      this.coverageSelectedTab.set('departamentos');
      return;
    }

    if (depCount === 0 && munCount > 0) {
      this.coverageSelectedTab.set('municipios');
      return;
    }

    if (munCount === 0 && depCount > 0) {
      this.coverageSelectedTab.set('departamentos');
      return;
    }

    if (depCount === 0 && munCount === 0) {
      this.coverageSelectedTab.set('departamentos');
    }
  }

  updateCoverageDepartamentoInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value ?? '';
    this.coverageDepartamentoInput.set(raw);
    const exact = this.departamentos().find(dep => this.normalizeSearchText(dep.nombre) === this.normalizeSearchText(raw));
    this.coverageDepartamentoFilter.set(exact?.idDepartamento ?? null);
    this.departamentoToAssign.set(exact?.idDepartamento ?? null);
    this.coverageMunicipioInput.set('');
    this.municipioToAssign.set(null);
  }

  updateCoverageMunicipioInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value ?? '';
    this.coverageMunicipioInput.set(raw);
    const exact = this.availableMunicipiosForCoverage().find(m => this.normalizeSearchText(m.nombre) === this.normalizeSearchText(raw));
    this.municipioToAssign.set(exact?.idMunicipio ?? null);
  }

  clearCoverageFilters(): void {
    this.coverageDepartamentoFilter.set(null);
    this.departamentoToAssign.set(null);
    this.coverageDepartamentoInput.set('');
    this.coverageMunicipioInput.set('');
    this.municipioToAssign.set(null);
    this.showCoverageDepartamentoDropdown = false;
    this.showCoverageMunicipioDropdown = false;
  }

  assignCoverageDepartamento(): void {
    const secretaria = this.selectedSecretaryForCoverage();
    const idDepartamento = this.departamentoToAssign();
    if (!secretaria || !idDepartamento || this.coverageTipo() === 'M') return;
    if (this.coverageTipo() === 'D' && this.coberturaDepartamental().some(c => c.idDepartamento !== idDepartamento)) {
      this.alert.warning('Cobertura no permitida', 'Una secretaría departamental solo puede tener cobertura en su departamento.');
      return;
    }

    this.savingCoverage.set(true);
    this.secretariaAdminService.assignCoberturaDepartamental(secretaria.idSecretaria, {
      idDepartamento,
      backfillBeneficiarios: true,
    }).subscribe({
      next: () => {
        this.savingCoverage.set(false);
        this.coverageSelectedTab.set('departamentos');
        this.loadCoverage(secretaria.idSecretaria);
        this.alert.success('Operación exitosa', 'Cobertura departamental actualizada con expansión a municipios.');
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al asignar cobertura departamental:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo asignar la cobertura departamental.');
      }
    });
  }

  setMunicipioToAssign(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.municipioToAssign.set(Number.isFinite(value) && value > 0 ? value : null);
  }

  assignCoverageMunicipio(): void {
    const secretaria = this.selectedSecretaryForCoverage();
    const idMunicipio = this.municipioToAssign();
    if (!secretaria || !idMunicipio || this.loadingCoverage() || this.savingCoverage()) return;
    if (!this.availableMunicipiosForCoverage().some(m => m.idMunicipio === idMunicipio)) {
      this.alert.warning('Cobertura no permitida', 'Selecciona un municipio permitido de la cobertura de la secretaría.');
      return;
    }

    this.savingCoverage.set(true);
    this.secretariaAdminService.assignCoberturaMunicipal(secretaria.idSecretaria, {
      idMunicipio,
      backfillBeneficiarios: true,
    }).subscribe({
      next: () => {
        this.savingCoverage.set(false);
        this.municipioToAssign.set(null);
        this.coverageSelectedTab.set('municipios');
        this.loadCoverage(secretaria.idSecretaria);
        this.alert.success('Operación exitosa', 'Cobertura municipal actualizada y beneficiarios compartidos.');
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al asignar cobertura municipal:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo asignar la cobertura municipal.');
      }
    });
  }

  async removeCoverageMunicipio(idMunicipio: number): Promise<void> {
    const secretaria = this.selectedSecretaryForCoverage();
    if (!secretaria) return;

    const confirmed = await this.alert.confirm(
      'Desactivar municipio',
      '¿Deseas dejar de atender beneficiarios en este municipio? Los registros existentes no se eliminarán.',
      'Desactivar',
      'Cancelar'
    );
    if (!confirmed) return;

    this.savingCoverage.set(true);
    this.secretariaAdminService.removeCoberturaMunicipal(secretaria.idSecretaria, idMunicipio).subscribe({
      next: () => {
        this.savingCoverage.set(false);
        this.loadCoverage(secretaria.idSecretaria);
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al desactivar cobertura municipal:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo desactivar la cobertura municipal.');
      }
    });
  }

  async removeCoverageDepartamento(idDepartamento: number): Promise<void> {
    const secretaria = this.selectedSecretaryForCoverage();
    if (!secretaria) return;

    const confirmed = await this.alert.confirm(
      'Quitar cobertura departamental',
      '¿Deseas desactivar esta cobertura departamental?',
      'Quitar',
      'Cancelar'
    );
    if (!confirmed) return;

    this.savingCoverage.set(true);
    this.secretariaAdminService.removeCoberturaDepartamental(secretaria.idSecretaria, idDepartamento).subscribe({
      next: () => {
        this.savingCoverage.set(false);
        this.loadCoverage(secretaria.idSecretaria);
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al desactivar cobertura departamental:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo desactivar la cobertura departamental.');
      }
    });
  }

  async activateCoverageDepartamento(idDepartamento: number): Promise<void> {
    const secretaria = this.selectedSecretaryForCoverage();
    if (!secretaria || this.savingCoverage() || this.loadingCoverage()) return;
    if (this.coverageTipo() !== 'D' || this.coverageDepartamento()?.idDepartamento !== idDepartamento) {
      this.alert.warning('Asignación no permitida', 'Solo puedes reactivar el departamento asignado a esta secretaría.');
      return;
    }

    const confirmed = await this.alert.confirm(
      'Reactivar asignación al departamento',
      `¿Deseas reactivar la asignación a ${this.coverageDepartamento()?.nombre}? También se activará la atención en todos sus municipios, incluidos los desactivados anteriormente.`,
      'Reactivar asignación',
      'Cancelar'
    );
    if (!confirmed || this.selectedSecretaryForCoverage()?.idSecretaria !== secretaria.idSecretaria
      || this.savingCoverage()) return;

    this.savingCoverage.set(true);
    this.secretariaAdminService.assignCoberturaDepartamental(secretaria.idSecretaria, {
      idDepartamento,
      backfillBeneficiarios: true,
    }).pipe(timeout(45000), finalize(() => this.savingCoverage.set(false))).subscribe({
      next: () => {
        this.coverageSelectedTab.set('departamentos');
        this.loadCoverage(secretaria.idSecretaria);
        this.alert.success('Asignación reactivada', 'Se habilitó la atención en los municipios del departamento.');
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al activar cobertura departamental:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo reactivar la asignación al departamento. Vuelve a consultar su estado antes de reintentar.');
      }
    });
  }

  async activateCoverageMunicipio(idMunicipio: number): Promise<void> {
    const secretaria = this.selectedSecretaryForCoverage();
    if (!secretaria || this.savingCoverage() || this.loadingCoverage()) return;
    if (!this.canActivateCoverageMunicipio(idMunicipio)) {
      this.alert.warning('Cobertura no permitida', 'El municipio debe pertenecer a la cobertura territorial permitida de la secretaría.');
      return;
    }

    const confirmed = await this.alert.confirm(
      'Activar municipio',
      '¿Deseas habilitar este municipio para atender beneficiarios?',
      'Activar',
      'Cancelar'
    );
    if (!confirmed || this.selectedSecretaryForCoverage()?.idSecretaria !== secretaria.idSecretaria
      || this.savingCoverage() || !this.canActivateCoverageMunicipio(idMunicipio)) return;

    this.savingCoverage.set(true);
    this.secretariaAdminService.assignCoberturaMunicipal(secretaria.idSecretaria, {
      idMunicipio,
      backfillBeneficiarios: true,
    }).pipe(timeout(45000), finalize(() => this.savingCoverage.set(false))).subscribe({
      next: () => {
        this.savingCoverage.set(false);
        this.coverageSelectedTab.set('municipios');
        this.loadCoverage(secretaria.idSecretaria);
        this.alert.success('Municipio activado', 'Se habilitó la atención de beneficiarios en este municipio.');
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al activar cobertura municipal:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo activar el municipio. Vuelve a consultar su estado antes de reintentar.');
      }
    });
  }

  coverageTipo = computed(() => this.selectedSecretaryForCoverage()?.tipo ?? null);

  coverageDepartamento = computed(() => {
    if (this.coverageTipo() === 'M') {
      const cobertura = this.coberturaMunicipal();
      if (cobertura.length !== 1) return null;
      const municipio = this.municipios().find(m => m.idMunicipio === cobertura[0].idMunicipio);
      return this.departamentos().find(d => d.idDepartamento === municipio?.idDepartamentoFk) ?? null;
    }
    const departamentos = this.coberturaDepartamental();
    if (this.coverageTipo() !== 'D' || departamentos.length !== 1) return null;
    return this.departamentos().find(d => d.idDepartamento === departamentos[0].idDepartamento) ?? null;
  });

  coverageDepartamentoActivo = computed(() => {
    const departamento = this.coverageDepartamento();
    return departamento != null && (this.coverageTipo() === 'M'
      || this.activeCoverageDepartamentoIds().has(departamento.idDepartamento));
  });

  canActivateCoverageMunicipio(idMunicipio: number): boolean {
    return this.coverageActivationBlockReason(idMunicipio) === null;
  }

  coverageActivationBlockReason(idMunicipio: number): string | null {
    if (this.loadingCoverage()) return 'Espera a que termine de cargar la asignación.';
    if (!this.coverageDepartamento()) {
      return 'No se pudo identificar un único departamento asignado. Solicita al administrador revisar la asignación.';
    }
    if (!this.coverageDepartamentoActivo()) {
      return 'Primero pulsa «Reactivar asignación» en la sección Departamento de este modal. La secretaría está habilitada, pero su asignación al departamento está desactivada.';
    }
    if (this.coverageTipo() === 'M') {
      return this.coberturaMunicipal().length === 1
        && this.coberturaMunicipal()[0].idMunicipio === idMunicipio
        ? null : 'Solo se puede activar el municipio original de esta secretaría.';
    }
    const municipio = this.municipios().find(m => m.idMunicipio === idMunicipio);
    if (!municipio) return 'No se encontraron los datos del municipio. Cierra y vuelve a abrir la vista para reintentar.';
    return municipio.idDepartamentoFk === this.coverageDepartamento()?.idDepartamento
      ? null : 'Este municipio no pertenece al departamento asignado a la secretaría.';
  }

  /** Una secretaría municipal solo conserva su municipio: no se agregan departamentos ni otros municipios. */
  coverageMunicipalLocked = computed(() => this.coverageTipo() === 'M' && this.coberturaMunicipal().length > 0);

  activeCoverageDepartamentoIds = computed(() =>
    new Set(this.coberturaDepartamental().filter(c => c.estado === 'A').map(c => c.idDepartamento)));

  coverageMunicipioRequiereDepartamento = computed(() => {
    const dept = this.coverageDepartamentoFilter();
    return this.coverageTipo() === 'D' && dept != null && !this.activeCoverageDepartamentoIds().has(dept);
  });

  coverageRuleMessage = computed(() => {
    const tipo = this.coverageTipo();
    if (tipo === 'M') {
      const municipio = this.coberturaMunicipal()[0]?.nombreMunicipio;
      return municipio
        ? `Esta secretaría solo puede atender en ${municipio}. Puedes activar o desactivar ese municipio, pero no cambiarlo por otro.`
        : 'No se pudo identificar su municipio original. Solicita al administrador revisar la asignación.';
    }
    if (tipo === 'D') {
      return 'Puedes agregar o reactivar municipios del departamento indicado. No se permiten municipios de otros departamentos.';
    }
    return '';
  });

  availableMunicipiosForCoverage = computed(() => {
    const usados = new Set(this.coberturaMunicipal().filter(c => c.estado === 'A').map(c => c.idMunicipio));
    const query = this.normalizeSearchText(this.coverageMunicipioInput());
    const dept = this.coverageDepartamento()?.idDepartamento;
    if (this.loadingCoverage() || !this.coverageDepartamentoActivo() || dept == null) return [];
    const municipioOriginal = this.coverageTipo() === 'M' ? this.coberturaMunicipal()[0]?.idMunicipio : null;
    return this.municipios().filter(m => {
      if (usados.has(m.idMunicipio)) return false;
      if (this.coverageTipo() === 'M' && m.idMunicipio !== municipioOriginal) return false;
      const byDept = m.idDepartamentoFk === dept;
      const bySearch = !query || this.normalizeSearchText(m.nombre).includes(query);
      return byDept && bySearch;
    });
  });

  availableDepartamentosForCoverage = computed(() => {
    const query = this.normalizeSearchText(this.coverageDepartamentoInput());
    const asignados = new Set(this.coberturaDepartamental().map(c => c.idDepartamento));
    const base = this.coverageTipo() === 'D' && asignados.size > 0
      ? this.departamentos().filter(dep => asignados.has(dep.idDepartamento))
      : this.departamentos();
    if (!query) return base;
    return base.filter(dep => this.normalizeSearchText(dep.nombre).includes(query));
  });

  getMatchParts(text: string, query: string): { before: string; match: string; after: string } {
    const source = text ?? '';
    const q = (query ?? '').trim();
    if (!q) {
      return { before: source, match: '', after: '' };
    }

    const sourceLower = source.toLocaleLowerCase();
    const queryLower = q.toLocaleLowerCase();
    const index = sourceLower.indexOf(queryLower);
    if (index < 0) {
      return { before: source, match: '', after: '' };
    }

    return {
      before: source.slice(0, index),
      match: source.slice(index, index + q.length),
      after: source.slice(index + q.length),
    };
  }

  private loadCoverage(idSecretaria: number): void {
    this.loadingCoverage.set(true);
    forkJoin({
      departamentos: this.secretariaAdminService.getCoberturaDepartamental(idSecretaria),
      municipios: this.secretariaAdminService.getCoberturaMunicipal(idSecretaria)
    }).pipe(timeout(45000), finalize(() => this.loadingCoverage.set(false))).subscribe({
      next: coberturas => {
        this.coberturaDepartamental.set(coberturas.departamentos);
        this.coberturaMunicipal.set(coberturas.municipios);
        this.syncCoverageSelectedTab();
      },
      error: error => {
        console.error('Error al cargar cobertura territorial:', error);
        this.alert.error('Operación fallida', 'No se pudo cargar la cobertura territorial. Cierra y vuelve a abrir el modal para reintentar.');
      }
    });
  }

  async updateActiveSecretaryName(): Promise<void> {
    if (this.activeSecretaryForm.invalid) {
      this.activeSecretaryForm.markAllAsTouched();
      return;
    }
    const nombre = String(this.activeSecretaryForm.getRawValue().nombre ?? '').trim();
    const confirmed = await this.alert.confirm(
      'Actualizar secretaría activa',
      `¿Deseas cambiar el nombre de la secretaría activa a "${nombre}"?`,
      'Actualizar',
      'Cancelar'
    );
    if (!confirmed) return;

    this.editingActiveSecretary.set(true);
    this.secretariaAdminService.updateActiveName(nombre).subscribe({
      next: secretaria => {
        this.activeSecretaryName.set(secretaria.nombre);
        this.secretarias.update(secretarias => secretarias.map(item =>
          item.idSecretaria === secretaria.idSecretaria ? secretaria : item
        ));
        this.editingActiveSecretary.set(false);
        this.alert.success('Operación exitosa', 'Nombre de secretaría actualizado');
      },
      error: error => {
        console.error('Error al actualizar secretaría activa:', error);
        this.editingActiveSecretary.set(false);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo actualizar la secretaría activa');
      }
    });
  }

  async openSecretaryParameters(secretaria: ISecretaria): Promise<void> {
    const activeId = this.tokenService.getActiveSecretaryId();
    if (activeId !== secretaria.idSecretaria) {
      this.alert.warning('Secretaría no activa', 'Solo puedes editar parámetros de la secretaría activa.');
      return;
    }

    this.loadParametersForSecretary(secretaria);
  }

  private loadParametersForSecretary(secretaria: ISecretaria): void {
    this.selectedSecretaryForParameters.set(secretaria);
    this.parameterModalOpen.set(true);
    this.loadingParameters.set(true);
    this.currentParameters.set(null);

    this.parametroNegocioService.getActive().pipe(timeout(45000)).subscribe({
      next: parametros => {
        this.currentParameters.set(parametros);
        this.loadingParameters.set(false);
      },
      error: error => {
        this.loadingParameters.set(false);
        if (error?.status === 404) {
          this.currentParameters.set(null);
          return;
        }
        console.error('Error al cargar parámetros:', error);
        this.parameterModalOpen.set(false);
        this.alert.error('Operación fallida', 'No se pudieron cargar los parámetros de la secretaría activa.');
      }
    });
  }

  async saveSecretaryParameters(payload: IParametroNegocio): Promise<void> {
    if (this.savingParameters()) return;
    const secretaria = this.selectedSecretaryForParameters();
    if (!secretaria) return;

    const confirmed = await this.alert.confirm(
      'Guardar parámetros',
      `¿Deseas guardar los parámetros institucionales de "${secretaria.nombre}"?`,
      'Guardar',
      'Cancelar'
    );
    if (!confirmed) return;

    this.savingParameters.set(true);
    this.parametroNegocioService.upsertActive(payload).subscribe({
      next: () => {
        this.savingParameters.set(false);
        this.parameterModalOpen.set(false);
        this.alert.success('Operación exitosa', `Parámetros institucionales de "${secretaria.nombre}" actualizados.`);
      },
      error: error => {
        this.savingParameters.set(false);
        console.error('Error al guardar parámetros:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudieron guardar los parámetros institucionales.');
      }
    });
  }

  isActiveSecretary(secretaria: ISecretaria): boolean {
    return this.tokenService.getActiveSecretaryId() === secretaria.idSecretaria;
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
}
