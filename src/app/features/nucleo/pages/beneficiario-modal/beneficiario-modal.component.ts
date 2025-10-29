import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-beneficiario-modal',
  templateUrl: './beneficiario-modal.component.html',
  styleUrls: ['./beneficiario-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule
  ]
})
export class BeneficiarioModalComponent {
  isEdit = false;
  constructor(
    public dialogRef: MatDialogRef<BeneficiarioModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { form: FormGroup, isEdit?: boolean }
  ) {
    this.isEdit = data.isEdit ?? false;
  }

  get beneficiarioForm(): FormGroup {
    return this.data.form;
  }

  guardar(): void {
    if (this.beneficiarioForm.invalid) {
      this.beneficiarioForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.beneficiarioForm.value);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}