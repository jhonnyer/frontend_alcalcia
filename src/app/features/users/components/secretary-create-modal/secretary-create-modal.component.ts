import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IParametroNegocio } from '../../../../core/models/parametro-negocio.model';
import { AlertService } from '../../../../core/services/alert.service';

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

  @Output() cancel = new EventEmitter<void>();
  @Output() create = new EventEmitter<CreateSecretaryModalPayload>();

  private readonly fb = inject(FormBuilder);
  private readonly alert = inject(AlertService);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required]],
    codigo: ['', [Validators.required]],
    prefijoProducto: ['', [Validators.required]],
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
    void this.onCancel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.form.reset({
        nombre: '',
        codigo: '',
        prefijoProducto: '',
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
    }
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
        estado: 'A'
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

    return required.every(name => this.form.get(name)?.valid === true);
  }
}
