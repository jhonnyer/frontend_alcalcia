import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IParametroNegocio } from '../../../../core/models/parametro-negocio.model';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-secretary-parameters-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './secretary-parameters-modal.component.html',
})
export class SecretaryParametersModalComponent implements OnChanges {
  @Input() open = false;
  @Input() loading = false;
  @Input() saving = false;
  @Input() secretariaName = '';
  @Input() parameters: IParametroNegocio | null = null;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<IParametroNegocio>();

  private readonly fb = inject(FormBuilder);
  private readonly alert = inject(AlertService);

  readonly form = this.fb.group({
    nombreAlcaldia: ['', [Validators.required]],
    nombreAlcalde: ['', [Validators.required]],
    nombreSecretaria: ['', [Validators.required]],
    correoAlcaldia: ['', [Validators.email]],
    direccionAlcaldia: [''],
    codigoPostal: [''],
    contactoAlcaldia: [''],
    firmaActa: ['']
  });

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (!this.open) return;
    void this.onCancel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
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

    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) {
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
      firmaActa: parametros?.firmaActa ?? ''
    };
  }
}
