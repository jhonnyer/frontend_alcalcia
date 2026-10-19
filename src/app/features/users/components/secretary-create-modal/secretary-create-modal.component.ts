import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IParametroNegocio } from '../../../../core/models/parametro-negocio.model';
import { AlertService } from '../../../../core/services/alert.service';
import { IMunicipio } from '../../../../core/models/municipio.model';
import { IDepartamento } from '../../../../core/models/departamento.model';
import { ICreateSecretariaAdmin, TipoSecretaria } from '../../../../core/models/secretaria.model';
import { leerLogoInstitucional } from '../logo-institucional';
import { LogoPreviewComponent } from '../logo-preview.component';

export interface CreateSecretaryModalPayload {
  secretaria: {
    nombre: string;
    codigo: string;
    prefijoProducto: string;
    tipo: TipoSecretaria;
    estado: 'A';
    idsMunicipio?: number[];
    idsDepartamento?: number[];
  };
  admin: ICreateSecretariaAdmin;
  parametros: IParametroNegocio;
}

@Component({
  selector: 'app-secretary-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LogoPreviewComponent],
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
  private readonly cdr = inject(ChangeDetectorRef);
  departamentoFiltro: number | null = null;
  readingLogo = false;
  private logoReadId = 0;

  readonly form = this.fb.group({
    nombre: ['', [Validators.required]],
    codigo: ['', [Validators.required]],
    prefijoProducto: ['', [Validators.required]],
    tipo: this.fb.control<TipoSecretaria | null>(null, Validators.required),
    idsMunicipio: this.fb.nonNullable.control<number[]>([], Validators.required),
    idsDepartamento: this.fb.nonNullable.control<number[]>([]),
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
    logoInstitucional: [''],
  });

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (!this.open) return;
    void this.onCancel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.logoReadId++;
      this.readingLogo = false;
      this.form.reset({
        nombre: '',
        codigo: '',
        prefijoProducto: '',
        tipo: null,
        idsMunicipio: [],
        idsDepartamento: [],
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
        logoInstitucional: '',
      });
      this.departamentoFiltro = null;
    }
  }

  tipoSeleccionado(): TipoSecretaria | null {
    return this.form.get('tipo')?.value ?? null;
  }

  setTipo(tipo: TipoSecretaria): void {
    if (this.loading) return;
    if (this.tipoSeleccionado() === tipo) return;
    this.form.patchValue({ tipo, idsMunicipio: [], idsDepartamento: [] });
    this.form.get('tipo')?.markAsDirty();
    this.departamentoFiltro = null;
  }

  municipiosDelDepartamento(): IMunicipio[] {
    return this.municipios.filter(m => m.idDepartamentoFk === this.departamentoFiltro);
  }

  changeDepartamento(event: Event): void {
    if (this.loading) return;
    const id = Number((event.target as HTMLSelectElement).value);
    const departamento = this.departamentos.find(d => d.idDepartamento === id);
    if (!departamento) {
      this.alert.warning('Departamento no válido', 'Selecciona un departamento de la lista.');
      return;
    }
    this.departamentoFiltro = id;
    this.form.patchValue({
      idsDepartamento: this.tipoSeleccionado() === 'D' ? [id] : [],
      idsMunicipio: [],
    });
    this.form.markAsDirty();
    this.form.controls.idsDepartamento.markAsTouched();
  }

  changeMunicipio(event: Event): void {
    if (this.loading) return;
    const id = Number((event.target as HTMLSelectElement).value);
    if (this.tipoSeleccionado() !== 'M' || !this.municipiosDelDepartamento().some(m => m.idMunicipio === id)) {
      this.alert.warning('Municipio no válido', 'Selecciona un municipio del departamento indicado.');
      return;
    }
    this.form.controls.idsMunicipio.setValue([id]);
    this.form.controls.idsMunicipio.markAsDirty();
    this.form.controls.idsMunicipio.markAsTouched();
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

    this.logoReadId++;
    this.readingLogo = false;
    this.cancel.emit();
  }

  async selectLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.loading || this.readingLogo) return;
    const readId = ++this.logoReadId;
    this.readingLogo = true;
    try {
      const dataUrl = await leerLogoInstitucional(file);
      if (readId !== this.logoReadId || !this.open) return;
      this.form.controls.logoInstitucional.setValue(dataUrl);
      this.form.controls.logoInstitucional.markAsDirty();
    } catch (error) {
      if (readId === this.logoReadId && this.open) {
        this.alert.error('No se pudo cargar el logo', error instanceof Error ? error.message : 'Verifica que la imagen sea válida.');
      }
    } finally {
      if (readId === this.logoReadId) {
        this.readingLogo = false;
        this.cdr.markForCheck();
      }
    }
  }

  useDefaultLogo(): void {
    if (this.loading || this.readingLogo) return;
    this.form.controls.logoInstitucional.setValue('');
    this.form.controls.logoInstitucional.markAsDirty();
  }

  onSubmit(): void {
    if (this.loading || this.readingLogo) return;
    const requiredControls = [
      'nombre',
      'codigo',
      'prefijoProducto',
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
    this.form.get('idsMunicipio')?.markAsTouched();
    this.form.get('idsDepartamento')?.markAsTouched();
    this.form.get('tipo')?.markAsTouched();
    if (!this.canSubmit()) return;

    const v = this.form.getRawValue();
    if (!v.tipo) return;
    const payload: CreateSecretaryModalPayload = {
      secretaria: {
        nombre: String(v.nombre ?? '').trim(),
        codigo: String(v.codigo ?? '').trim(),
        prefijoProducto: String(v.prefijoProducto ?? '').trim(),
        tipo: v.tipo,
        estado: 'A',
        idsMunicipio: this.normalizeMunicipioIds(v.idsMunicipio),
        idsDepartamento: this.normalizeDepartamentoIds(v.idsDepartamento)
      },
      admin: {
        primerNombre: String(v.adminPrimerNombre ?? '').trim(),
        segundoNombre: String(v.adminSegundoNombre ?? '').trim(),
        primerApellido: String(v.adminPrimerApellido ?? '').trim(),
        segundoApellido: String(v.adminSegundoApellido ?? '').trim(),
        tipoIdentificacion: (v.adminTipoIdentificacion ?? 'CC') as ICreateSecretariaAdmin['tipoIdentificacion'],
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
        logoInstitucional: v.logoInstitucional ?? '',
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

  private normalizeDepartamentoIds(rawValue: unknown): number[] | undefined {
    const values = Array.isArray(rawValue) ? rawValue : [];
    const unique = new Set<number>();
    for (const token of values) {
      const value = Number(token);
      if (!Number.isInteger(value) || value <= 0) continue;
      unique.add(value);
    }
    return unique.size ? Array.from(unique) : undefined;
  }

  canSubmit(): boolean {
    const required = [
      'nombre',
      'codigo',
      'prefijoProducto',
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

    return !this.readingLogo && required.every(name => this.form.get(name)?.valid === true) && this.coverageIsValid();
  }

  coverageIsValid(): boolean {
    const municipios = this.normalizeMunicipioIds(this.form.get('idsMunicipio')?.value) ?? [];
    const departamentos = this.normalizeDepartamentoIds(this.form.get('idsDepartamento')?.value) ?? [];
    if (this.tipoSeleccionado() === 'M') {
      return municipios.length === 1 && departamentos.length === 0
        && this.municipiosDelDepartamento().some(m => m.idMunicipio === municipios[0]);
    }
    if (this.tipoSeleccionado() === 'D') {
      return departamentos.length === 1
        && this.departamentos.some(d => d.idDepartamento === departamentos[0])
        && municipios.every(id =>
        departamentos.includes(this.municipios.find(m => m.idMunicipio === id)?.idDepartamentoFk ?? -1));
    }
    return false;
  }
}
