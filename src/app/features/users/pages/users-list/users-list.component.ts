import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    SecretaryCreateModalComponent,
    SecretaryParametersModalComponent,
    ResponsibleUpdateComponent,
  ],
  templateUrl: `./users-list.component.html`,
  styles: '',
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

  activeSecretaryForm = this.fb.group({
    nombre: ['', [Validators.required]]
  });

  filteredSecretarias = computed(() => {
    const query = this.normalizeSearchText(this.secretariaSearch());
    return this.secretarias().filter(secretaria => {
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

  private loadData(): void {
    this.loading.set(true);
    this.departamentoService.getAll().subscribe({
      next: departamentos => this.departamentos.set(departamentos),
      error: error => console.error('Error al cargar departamentos:', error)
    });

    this.municipioService.getAll().subscribe({
      next: municipios => this.municipios.set(municipios),
      error: error => console.error('Error al cargar municipios:', error)
    });

    this.secretariaAdminService.getAll().subscribe({
      next: secretarias => {
        this.secretarias.set(secretarias);
        const activeId = this.tokenService.getActiveSecretaryId();
        const active = secretarias.find(secretaria => secretaria.idSecretaria === activeId);
        if (active) {
          this.activeSecretaryName.set(active.nombre);
          this.activeSecretaryForm.patchValue({ nombre: active.nombre });
        }
      },
      error: error => console.error('Error al cargar secretarías:', error)
    });
    this.responsibleService.getAll().subscribe({
      next: responsables => {
        this.responsables.set(responsables);
        this.loading.set(false);
      },
      error: error => {
        console.error('Error al cargar usuarios:', error);
        this.loading.set(false);
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

    const confirmed = await this.alert.confirm(
      'Crear secretaría',
      `¿Deseas crear la secretaría "${payload.secretaria.nombre}"? Se creará activa por defecto.`,
      'Crear',
      'Cancelar'
    );
    if (!confirmed) return;

    this.creatingSecretary.set(true);
    this.secretariaAdminService.create(payload.secretaria).subscribe({
      next: secretaria => {
        this.secretarias.update(secretarias => [...secretarias, secretaria]);

        const continueWithAdmin = (parametersSaved: boolean) => this.createOptionalAdminForSecretary(secretaria, payload, parametersSaved);

        if (payload.parametros) {
          this.trySaveParametersForCreatedSecretary(secretaria, payload.parametros, continueWithAdmin);
          return;
        }

        continueWithAdmin(false);
      },
      error: error => {
        console.error('Error al crear secretaría:', error);
        this.creatingSecretary.set(false);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo crear la secretaría');
      }
    });
  }

  private trySaveParametersForCreatedSecretary(
    secretaria: ISecretaria,
    parametros: IParametroNegocio,
    onDone: (parametersSaved: boolean) => void,
  ): void {
    const activeId = this.tokenService.getActiveSecretaryId();

    if (activeId !== secretaria.idSecretaria) {
      this.alert.warning(
        'Parámetros pendientes',
        'La secretaría fue creada, pero no se pudieron guardar sus parámetros automáticamente porque la API actual solo permite editar parámetros de la secretaría activa.'
      );
      onDone(false);
      return;
    }

    const payload: IParametroNegocio = {
      ...parametros,
      nombreSecretaria: parametros.nombreSecretaria || secretaria.nombre,
    };

    this.parametroNegocioService.upsertActive(payload).subscribe({
      next: () => onDone(true),
      error: error => {
        console.error('Error al crear parámetros para la nueva secretaría:', error);
        this.alert.warning('Creación parcial', 'La secretaría fue creada, pero no fue posible guardar sus parámetros institucionales.');
        onDone(false);
      }
    });
  }

  private createOptionalAdminForSecretary(secretaria: ISecretaria, payload: CreateSecretaryModalPayload, parametersSaved: boolean): void {
    if (!payload.admin) {
      this.creatingSecretary.set(false);
      this.secretaryModalOpen.set(false);
      this.alert.success('Operación exitosa', 'Secretaría creada correctamente.');
      return;
    }

    const adminPayload: Partial<IResponsable> = {
      primerNombre: payload.admin.primerNombre,
      segundoNombre: payload.admin.segundoNombre,
      primerApellido: payload.admin.primerApellido,
      segundoApellido: payload.admin.segundoApellido,
      tipoIdentificacion: payload.admin.tipoIdentificacion,
      numeroIdentificacion: payload.admin.numeroIdentificacion,
      area: 'Administración',
      cargo: 'Administrador',
      email: payload.admin.email,
      usuario: payload.admin.usuario,
      telefono: payload.admin.telefono,
      estado: 'A',
      perfilUsuario: 'ADMIN',
      password: payload.admin.password,
    };

    this.responsibleService.post(adminPayload).subscribe({
      next: responsable => {
        this.secretariaAdminService.assignResponsible(secretaria.idSecretaria, responsable.idResponsable, {
          rol: 'ADMIN',
          estado: 'A'
        }).subscribe({
          next: () => {
            this.creatingSecretary.set(false);
            this.secretaryModalOpen.set(false);
            if (parametersSaved) {
              this.alert.success('Operación exitosa', 'Secretaría, parámetros institucionales y usuario administrador creados correctamente.');
            } else {
              this.alert.warning('Creación parcial', 'La secretaría y el usuario administrador se crearon, pero los parámetros institucionales quedaron pendientes.');
            }
            this.loadData();
          },
          error: error => {
            this.creatingSecretary.set(false);
            this.secretaryModalOpen.set(false);
            console.error('Error al asignar administrador a la secretaría:', error);
            this.alert.warning('Creación parcial', 'La secretaría y el usuario administrador se crearon, pero no fue posible asociar la membresía automáticamente.');
            this.loadData();
          }
        });
      },
      error: error => {
        this.creatingSecretary.set(false);
        this.secretaryModalOpen.set(false);
        console.error('Error al crear usuario administrador:', error);
        this.alert.warning('Creación parcial', 'La secretaría se creó, pero el usuario administrador no pudo registrarse.');
        this.loadData();
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

  clearUsuarioSearch(): void {
    this.usuarioSearch.set('');
  }

  openSecretaryModal(): void {
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
    this.selectedSecretaryForCoverage.set(secretaria);
    this.coverageModalOpen.set(true);
    this.departamentoToAssign.set(null);
    this.municipioToAssign.set(null);
    this.coverageDepartamentoFilter.set(null);
    this.coverageDepartamentoInput.set('');
    this.coverageMunicipioInput.set('');
    this.showCoverageDepartamentoDropdown = false;
    this.showCoverageMunicipioDropdown = false;
    this.coverageSelectedTab.set('departamentos');
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
    if (this.coverageDepartamentoFilter() == null) return;
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
    if (this.coverageDepartamentoFilter() == null) return;
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
    if (!secretaria || !idDepartamento) return;

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
    if (!secretaria || !idMunicipio || this.coverageDepartamentoFilter() == null) return;

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
      'Quitar cobertura municipal',
      '¿Deseas desactivar esta cobertura municipal?',
      'Quitar',
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
    if (!secretaria) return;

    const confirmed = await this.alert.confirm(
      'Activar cobertura departamental',
      '¿Deseas activar esta cobertura departamental? También se sincronizarán sus municipios.',
      'Activar',
      'Cancelar'
    );
    if (!confirmed) return;

    this.savingCoverage.set(true);
    this.secretariaAdminService.assignCoberturaDepartamental(secretaria.idSecretaria, {
      idDepartamento,
      backfillBeneficiarios: true,
    }).subscribe({
      next: () => {
        this.savingCoverage.set(false);
        this.coverageSelectedTab.set('departamentos');
        this.loadCoverage(secretaria.idSecretaria);
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al activar cobertura departamental:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo activar la cobertura departamental.');
      }
    });
  }

  async activateCoverageMunicipio(idMunicipio: number): Promise<void> {
    const secretaria = this.selectedSecretaryForCoverage();
    if (!secretaria) return;

    const confirmed = await this.alert.confirm(
      'Activar cobertura municipal',
      '¿Deseas activar esta cobertura municipal?',
      'Activar',
      'Cancelar'
    );
    if (!confirmed) return;

    this.savingCoverage.set(true);
    this.secretariaAdminService.assignCoberturaMunicipal(secretaria.idSecretaria, {
      idMunicipio,
      backfillBeneficiarios: true,
    }).subscribe({
      next: () => {
        this.savingCoverage.set(false);
        this.coverageSelectedTab.set('municipios');
        this.loadCoverage(secretaria.idSecretaria);
      },
      error: error => {
        this.savingCoverage.set(false);
        console.error('Error al activar cobertura municipal:', error);
        this.alert.error('Operación fallida', error?.error?.mensaje || error?.error || 'No se pudo activar la cobertura municipal.');
      }
    });
  }

  availableMunicipiosForCoverage = computed(() => {
    const usados = new Set(this.coberturaMunicipal().filter(c => c.estado === 'A').map(c => c.idMunicipio));
    const query = this.normalizeSearchText(this.coverageMunicipioInput());
    const dept = this.coverageDepartamentoFilter();
    return this.municipios().filter(m => {
      if (usados.has(m.idMunicipio)) return false;
      const byDept = dept == null || m.idDepartamentoFk === dept;
      const bySearch = !query || this.normalizeSearchText(m.nombre).includes(query);
      return byDept && bySearch;
    });
  });

  availableDepartamentosForCoverage = computed(() => {
    const query = this.normalizeSearchText(this.coverageDepartamentoInput());
    if (!query) return this.departamentos();
    return this.departamentos().filter(dep => this.normalizeSearchText(dep.nombre).includes(query));
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
    this.secretariaAdminService.getCoberturaDepartamental(idSecretaria).subscribe({
      next: coberturas => {
        this.coberturaDepartamental.set(coberturas);
        this.syncCoverageSelectedTab();
      },
      error: error => console.error('Error al cargar cobertura departamental:', error)
    });
    this.secretariaAdminService.getCoberturaMunicipal(idSecretaria).subscribe({
      next: coberturas => {
        this.coberturaMunicipal.set(coberturas);
        this.syncCoverageSelectedTab();
        this.loadingCoverage.set(false);
      },
      error: error => {
        console.error('Error al cargar cobertura municipal:', error);
        this.loadingCoverage.set(false);
        this.alert.error('Operación fallida', 'No se pudo cargar la cobertura municipal.');
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

    this.parametroNegocioService.getActive().subscribe({
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
