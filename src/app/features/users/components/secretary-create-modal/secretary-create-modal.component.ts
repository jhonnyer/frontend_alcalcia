import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IParametroNegocio } from '../../../../core/models/parametro-negocio.model';
import { AlertService } from '../../../../core/services/alert.service';
import { IMunicipio } from '../../../../core/models/municipio.model';
import { IDepartamento } from '../../../../core/models/departamento.model';

export interface CreateSecretaryAdminInput {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  tipoIdentificacion: 'CC' | 'PA' | 'NIT' | 'TI' | 'CE';
  numeroIdentificacion: string;
  email: string;
  telefono: string;
  usuario: string;
  password: string;
}

export interface CreateSecretaryModalPayload {
  secretaria: {
    nombre: string;
    codigo: string;
    prefijoProducto: string;
    estado: 'A';
    idsMunicipio?: number[];
  };
  admin: CreateSecretaryAdminInput;
  parametros: IParametroNegocio;
}

@Component({
  selector: 'app-secretary-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './secretary-create-modal.component.html',
})
export class SecretaryCreateModalComponent implements OnChanges {
  @Input() open = false;
  @Input() loading = false;
  @Input() departamentos: IDepartamento[] = [];
  @Input() municipios: IMunicipio[] = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() create = new EventEmitter<CreateSecretaryModalPayload>();

  private readonly fb = inject(FormBuilder);
  private readonly alert = inject(AlertService);
  departamentoFiltro: number | null = null;
  departamentoBusqueda = '';
  municipioBusqueda = '';
  municipioToAdd: number | null = null;
  departamentoSeleccionadoNombre = '';
  municipioSeleccionadoNombre = '';
  showDepartamentoDropdown = false;
  showMunicipioDropdown = false;

  readonly form = this.fb.group({
    nombre: ['', [Validators.required]],
    codigo: ['', [Validators.required]],
    prefijoProducto: ['', [Validators.required]],
    idsMunicipio: this.fb.nonNullable.control<number[]>([], Validators.required),
    adminPrimerNombre: ['', [Validators.required]],
    adminSegundoNombre: [''],
    adminPrimerApellido: ['', [Validators.required]],
    adminSegundoApellido: [''],
    adminTipoIdentificacion: ['CC' as const, [Validators.required]],
    adminNumeroIdentificacion: ['', [Validators.required]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminTelefono: ['', [Validators.required]],
    adminUsuario: ['', [Validators.required]],
    adminPassword: ['', [Validators.required, Validators.minLength(6)]],
    parametroNombreAlcaldia: ['', [Validators.required]],
    parametroNombreAlcalde: ['', [Validators.required]],
    parametroNombreSecretaria: ['', [Validators.required]],
    parametroCorreoAlcaldia: ['', [Validators.email]],
    parametroDireccionAlcaldia: [''],
    parametroCodigoPostal: [''],
    parametroContactoAlcaldia: [''],
    parametroFirmaActa: [''],
  });

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (!this.open) return;
    this.showDepartamentoDropdown = false;
    this.showMunicipioDropdown = false;
    void this.onCancel();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-departamento')) {
      this.showDepartamentoDropdown = false;
    }
    if (!target.closest('.dropdown-municipio')) {
      this.showMunicipioDropdown = false;
    }
  }

  municipiosSeleccionados(): IMunicipio[] {
    const ids = this.normalizeMunicipioIds(this.form.get('idsMunicipio')?.value) ?? [];
    return this.municipios.filter(m => ids.includes(m.idMunicipio));
  }

  departamentosDisponibles(): IDepartamento[] {
    return this.departamentos;
  }

  departamentosFiltrados(): IDepartamento[] {
    const query = this.normalizeText(this.departamentoBusqueda);
    if (!query) return this.departamentosDisponibles();
    return this.departamentosDisponibles().filter(dep => this.normalizeText(dep.nombre).includes(query));
  }

  municipiosFiltrados(): IMunicipio[] {
    const query = this.normalizeText(this.municipioBusqueda);
    return this.municipios.filter(m => {
      const byDept = this.departamentoFiltro == null || m.idDepartamentoFk === this.departamentoFiltro;
      const bySearch = !query || this.normalizeText(m.nombre).includes(query);
      return byDept && bySearch;
    });
  }

  municipiosDisponiblesParaAgregar(): IMunicipio[] {
    const seleccionados = new Set((this.normalizeMunicipioIds(this.form.get('idsMunicipio')?.value) ?? []));
    return this.municipiosFiltrados().filter(m => !seleccionados.has(m.idMunicipio));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.form.reset({
        nombre: '',
        codigo: '',
        prefijoProducto: '',
        idsMunicipio: [],
        adminPrimerNombre: '',
        adminSegundoNombre: '',
        adminPrimerApellido: '',
        adminSegundoApellido: '',
        adminTipoIdentificacion: 'CC',
        adminNumeroIdentificacion: '',
        adminEmail: '',
        adminTelefono: '',
        adminUsuario: '',
        adminPassword: '',
        parametroNombreAlcaldia: '',
        parametroNombreAlcalde: '',
        parametroNombreSecretaria: '',
        parametroCorreoAlcaldia: '',
        parametroDireccionAlcaldia: '',
        parametroCodigoPostal: '',
        parametroContactoAlcaldia: '',
        parametroFirmaActa: '',
      });
      this.departamentoFiltro = null;
      this.departamentoBusqueda = '';
      this.municipioBusqueda = '';
      this.municipioToAdd = null;
      this.departamentoSeleccionadoNombre = '';
      this.municipioSeleccionadoNombre = '';
      this.showDepartamentoDropdown = false;
      this.showMunicipioDropdown = false;
    }
  }

  toggleDepartamentoDropdown(): void {
    this.showDepartamentoDropdown = !this.showDepartamentoDropdown;
    if (this.showDepartamentoDropdown) {
      this.showMunicipioDropdown = false;
      this.departamentoBusqueda = this.departamentoSeleccionadoNombre;
    }
  }

  toggleMunicipioDropdown(): void {
    if (this.departamentoFiltro == null) return;
    this.showMunicipioDropdown = !this.showMunicipioDropdown;
    if (this.showMunicipioDropdown) {
      this.showDepartamentoDropdown = false;
      this.municipioBusqueda = this.municipioSeleccionadoNombre;
    }
  }

  updateDepartamentoBusqueda(event: Event): void {
    this.departamentoBusqueda = (event.target as HTMLInputElement).value ?? '';
  }

  selectDepartamento(idDepartamento: number, nombre: string): void {
    this.departamentoFiltro = idDepartamento;
    this.departamentoSeleccionadoNombre = nombre;
    this.departamentoBusqueda = nombre;
    this.showDepartamentoDropdown = false;
    this.municipioBusqueda = '';
    this.municipioSeleccionadoNombre = '';
    this.municipioToAdd = null;
  }

  updateMunicipioBusqueda(event: Event): void {
    this.municipioBusqueda = (event.target as HTMLInputElement).value ?? '';
  }

  selectMunicipio(idMunicipio: number, nombre: string): void {
    this.municipioToAdd = idMunicipio;
    this.municipioSeleccionadoNombre = nombre;
    this.municipioBusqueda = nombre;
    this.showMunicipioDropdown = false;
  }

  clearMunicipioFilters(): void {
    this.departamentoFiltro = null;
    this.departamentoBusqueda = '';
    this.departamentoSeleccionadoNombre = '';
    this.municipioBusqueda = '';
    this.municipioSeleccionadoNombre = '';
    this.municipioToAdd = null;
    this.showDepartamentoDropdown = false;
    this.showMunicipioDropdown = false;
  }

  addMunicipio(): void {
    if (this.departamentoFiltro == null || this.municipioToAdd == null) return;
    const ids = this.normalizeMunicipioIds(this.form.get('idsMunicipio')?.value) ?? [];
    if (!ids.includes(this.municipioToAdd)) {
      this.form.patchValue({ idsMunicipio: [...ids, this.municipioToAdd] });
      this.form.get('idsMunicipio')?.markAsTouched();
      this.form.get('idsMunicipio')?.updateValueAndValidity();
    }
    this.municipioToAdd = null;
    this.municipioBusqueda = '';
    this.municipioSeleccionadoNombre = '';
  }

  getDepartamentoNombre(idDepartamento: number): string {
    const departamento = this.departamentos.find(d => d.idDepartamento === idDepartamento);
    return departamento?.nombre ?? `Departamento ${idDepartamento}`;
  }

  async onCancel(): Promise<void> {
    if (this.loading) return;

    if (this.form.dirty) {
      const confirmed = await this.alert.confirm(
        'Descartar cambios',
        'Tienes cambios sin guardar. ¿Deseas cerrar este formulario?',
        'Sí, cerrar',
        'Seguir editando'
      );
      if (!confirmed) return;
    }

    this.cancel.emit();
  }

  onSubmit(): void {
    const requiredControls = [
      'nombre',
      'codigo',
      'prefijoProducto',
      'idsMunicipio',
      'adminPrimerNombre',
      'adminPrimerApellido',
      'adminTipoIdentificacion',
      'adminNumeroIdentificacion',
      'adminEmail',
      'adminTelefono',
      'adminUsuario',
      'adminPassword',
      'parametroNombreAlcaldia',
      'parametroNombreAlcalde',
      'parametroNombreSecretaria',
    ];

    requiredControls.forEach(name => this.form.get(name)?.markAsTouched());
    if (!this.canSubmit()) return;

    const v = this.form.getRawValue();
    const payload: CreateSecretaryModalPayload = {
      secretaria: {
        nombre: String(v.nombre ?? '').trim(),
        codigo: String(v.codigo ?? '').trim(),
        prefijoProducto: String(v.prefijoProducto ?? '').trim(),
        estado: 'A',
        idsMunicipio: this.normalizeMunicipioIds(v.idsMunicipio)
      },
      admin: {
        primerNombre: String(v.adminPrimerNombre ?? '').trim(),
        segundoNombre: String(v.adminSegundoNombre ?? '').trim(),
        primerApellido: String(v.adminPrimerApellido ?? '').trim(),
        segundoApellido: String(v.adminSegundoApellido ?? '').trim(),
        tipoIdentificacion: (v.adminTipoIdentificacion ?? 'CC') as CreateSecretaryAdminInput['tipoIdentificacion'],
        numeroIdentificacion: String(v.adminNumeroIdentificacion ?? '').trim(),
        email: String(v.adminEmail ?? '').trim(),
        telefono: String(v.adminTelefono ?? '').trim(),
        usuario: String(v.adminUsuario ?? '').trim(),
        password: String(v.adminPassword ?? '').trim(),
      },
      parametros: {
        nombreAlcaldia: String(v.parametroNombreAlcaldia ?? '').trim(),
        nombreAlcalde: String(v.parametroNombreAlcalde ?? '').trim(),
        nombreSecretaria: String(v.parametroNombreSecretaria ?? v.nombre ?? '').trim(),
        correoAlcaldia: String(v.parametroCorreoAlcaldia ?? '').trim(),
        direccionAlcaldia: String(v.parametroDireccionAlcaldia ?? '').trim(),
        codigoPostal: String(v.parametroCodigoPostal ?? '').trim(),
        contactoAlcaldia: String(v.parametroContactoAlcaldia ?? '').trim(),
        firmaActa: String(v.parametroFirmaActa ?? '').trim(),
      }
    };

    this.create.emit(payload);
  }

  private normalizeMunicipioIds(rawValue: unknown): number[] | undefined {
    const values = Array.isArray(rawValue) ? rawValue : [];
    const unique = new Set<number>();
    for (const token of values) {
      const value = Number(token);
      if (!Number.isInteger(value) || value <= 0) continue;
      unique.add(value);
    }
    return unique.size ? Array.from(unique) : undefined;
  }

  private normalizeText(value: string | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }

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

  removeMunicipio(idMunicipio: number): void {
    const ids = this.normalizeMunicipioIds(this.form.get('idsMunicipio')?.value) ?? [];
    const filtered = ids.filter(id => id !== idMunicipio);
    this.form.patchValue({ idsMunicipio: filtered as number[] });
    this.form.get('idsMunicipio')?.markAsTouched();
    this.form.get('idsMunicipio')?.updateValueAndValidity();
  }

  canSubmit(): boolean {
    const required = [
      'nombre',
      'codigo',
      'prefijoProducto',
      'idsMunicipio',
      'adminPrimerNombre',
      'adminPrimerApellido',
      'adminTipoIdentificacion',
      'adminNumeroIdentificacion',
      'adminEmail',
      'adminTelefono',
      'adminUsuario',
      'adminPassword',
      'parametroNombreAlcaldia',
      'parametroNombreAlcalde',
      'parametroNombreSecretaria',
      'parametroCorreoAlcaldia',
    ];

    return required.every(name => this.form.get(name)?.valid === true);
  }
}
