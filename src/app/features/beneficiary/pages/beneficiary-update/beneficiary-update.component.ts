import { Component, Inject, OnInit, inject } from '@angular/core';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-beneficiary-update',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatIconModule],
  styleUrls: ['./beneficiary-update.component.scss'],
  templateUrl: './beneficiary-update.component.html'
})
export class BeneficiaryUpdateComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<BeneficiaryUpdateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string }, // 👈 Recibe el id del modal
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private pageTitleService: PageTitleService,
    private beneficiaryService: BeneficiaryService
  ) {}

  public formFamilyCore!: FormGroup;
  private beneficiarioId!: string;

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar beneficiario');
    this.beneficiarioId = this.data.id; // ✅ Usa el id que llega desde el modal
    this.initFormFamilyCore();
    this.getBeneficiarioById();

    this.formFamilyCore.valueChanges.subscribe(() => {
      this.formFamilyCore.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    });
  }

  getBeneficiarioById(){
    this.beneficiaryService.getById(this.beneficiarioId).subscribe({
      next: response => {
        this.initProject(response);
      }
    })
  }

  private initProject(beneficiario: IBeneficiarioUnique){
    this.formFamilyCore.patchValue({
      primerNombre: beneficiario.primerNombre,
      segundoNombre: beneficiario.segundoNombre,
      primerApellido: beneficiario.primerApellido,
      segundoApellido: beneficiario.segundoApellido,
      sexo: beneficiario.sexo,
      genero: beneficiario.genero,
      etnia: beneficiario.etnia,
      edad: beneficiario.edad,
      victimaConflicto: beneficiario.victimaConflicto,
      tipoDocumento: beneficiario.tipoDocumento,
      numeroDocumento: beneficiario.numeroDocumento,
      fechaNacimiento: beneficiario.fechaNacimiento,
      telefono: beneficiario.telefono,
      email: beneficiario.email,
      idNucleoFk: beneficiario.nucleoFamiliar.idNucleo,
      esVivo: beneficiario.esVivo,
      discapacidad: beneficiario.discapacidad,
      certificadoDiscapacidad: beneficiario.certificadoDiscapacidad
    }, { emitEvent: true })
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      edad: ['', Validators.required],
      sexo: ['', Validators.required],
      genero: ['', Validators.required],
      victimaConflicto: ['', Validators.required],
      esVivo: ['', Validators.required],
      discapacidad: ['', Validators.required],
      certificadoDiscapacidad: [{ value: '', disabled: true }, Validators.required],
      etnia: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      idNucleoFk: ['']
    });

    // 🔄 Calcular edad automáticamente (con mínimo en 0)
    this.formFamilyCore.get('fechaNacimiento')?.valueChanges.subscribe(date => {
      if (date) {
        const today = new Date();
        const birthDate = new Date(date);

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        // ✅ Evitar valores negativos
        if (age < 0) {
          age = 0;
        }

        this.formFamilyCore.get('edad')?.setValue(age, { emitEvent: false });
      } else {
        // Si no hay fecha → dejar en 0
        this.formFamilyCore.get('edad')?.setValue(0, { emitEvent: false });
      }
    });


    // 🔄 Habilitar certificado si discapacidad = true
    this.formFamilyCore.get('discapacidad')?.valueChanges.subscribe(value => {
      const certCtrl = this.formFamilyCore.get('certificadoDiscapacidad');
      if (value === true) {
        certCtrl?.enable();
      } else {
        certCtrl?.disable();
        certCtrl?.reset('');
      }
    });
  }

  cancelar(){
    this.formFamilyCore.reset(); // Limpia los campos del formulario
    this.dialogRef.close()
  }

  onSubmit() {
    if (this.formFamilyCore.valid) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: { mensaje: '¿Desea guardar los cambios de este beneficiario?' }
      });

      confirmRef.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.beneficiaryService.update(this.beneficiarioId, this.formFamilyCore.value).subscribe({
            next: (response) => {
              this.snackBar.open(response.mensaje || '✅ Beneficiario actualizado correctamente.', 'Cerrar', { duration: 3000 });
              this.dialogRef.close('updated'); // 👈 cerrar el modal devolviendo el resultado
            },
            error: () => {
              this.snackBar.open('❌ Ha ocurrido un error al guardar el beneficiario', 'Cerrar', { duration: 3000 });
            }
          });
        }
      });
    } else {
      this.formFamilyCore.markAllAsTouched();
      this.snackBar.open('⚠️ Verifica los campos del formulario', 'Cerrar', { duration: 3000 });
    }
  }

}
