import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IParametroNegocio } from '../../../../core/models/parametro-negocio.model';
import { AlertService } from '../../../../core/services/alert.service';
import { TipoSecretaria } from '../../../../core/models/secretaria.model';
import { leerLogoInstitucional } from '../logo-institucional';
import { LogoPreviewComponent } from '../logo-preview.component';

@Component({
  selector: 'app-secretary-parameters-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LogoPreviewComponent],
  templateUrl: './secretary-parameters-modal.component.html',
})
export class SecretaryParametersModalComponent implements OnChanges {
  @Input() open = false;
  @Input() loading = false;
  @Input() saving = false;
  @Input() secretariaName = '';
  @Input() tipoSecretaria?: TipoSecretaria;
  @Input() parameters: IParametroNegocio | null = null;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<IParametroNegocio>();

  private readonly fb = inject(FormBuilder);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);
  readingLogo = false;
  private logoReadId = 0;

  readonly form = this.fb.group({
    nombreAlcaldia: ['', [Validators.required]],
    nombreAlcalde: ['', [Validators.required]],
    nombreSecretaria: ['', [Validators.required]],
    correoAlcaldia: ['', [Validators.email]],
    direccionAlcaldia: [''],
    codigoPostal: [''],
    contactoAlcaldia: [''],
    firmaActa: [''],
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
      this.form.reset(this.toForm(this.parameters, this.secretariaName));
      return;
    }

    if (changes['parameters'] && this.open && !this.loading) {
      this.form.patchValue(this.toForm(this.parameters, this.secretariaName));
    }
  }

  async onCancel(): Promise<void> {
    if (this.saving) return;

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
    if (!file || this.saving || this.loading || this.readingLogo) return;
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
    if (this.saving || this.readingLogo) return;
    this.form.controls.logoInstitucional.setValue('');
    this.form.controls.logoInstitucional.markAsDirty();
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving || this.loading || this.readingLogo) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    this.save.emit({
      nombreAlcaldia: String(values.nombreAlcaldia ?? '').trim(),
      nombreAlcalde: String(values.nombreAlcalde ?? '').trim(),
      nombreSecretaria: String(values.nombreSecretaria ?? this.secretariaName).trim(),
      correoAlcaldia: String(values.correoAlcaldia ?? '').trim(),
      direccionAlcaldia: String(values.direccionAlcaldia ?? '').trim(),
      codigoPostal: String(values.codigoPostal ?? '').trim(),
      contactoAlcaldia: String(values.contactoAlcaldia ?? '').trim(),
      firmaActa: String(values.firmaActa ?? '').trim(),
      logoInstitucional: values.logoInstitucional ?? '',
    });
  }

  private toForm(parametros: IParametroNegocio | null, secretariaName: string) {
    return {
      nombreAlcaldia: parametros?.nombreAlcaldia ?? '',
      nombreAlcalde: parametros?.nombreAlcalde ?? '',
      nombreSecretaria: parametros?.nombreSecretaria ?? secretariaName ?? '',
      correoAlcaldia: parametros?.correoAlcaldia ?? '',
      direccionAlcaldia: parametros?.direccionAlcaldia ?? '',
      codigoPostal: parametros?.codigoPostal ?? '',
      contactoAlcaldia: parametros?.contactoAlcaldia ?? '',
      firmaActa: parametros?.firmaActa ?? '',
      logoInstitucional: parametros?.logoInstitucional ?? '',
    };
  }
}
