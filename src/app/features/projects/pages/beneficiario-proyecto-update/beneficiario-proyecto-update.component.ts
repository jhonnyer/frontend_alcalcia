import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-beneficiario-proyecto-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './beneficiario-proyecto-update.component.html',
  styleUrl: './beneficiario-proyecto-update.component.scss'
})
export class BeneficiarioProyectoUpdateComponent implements OnInit {
  @Input('id') beneficiarioProyectoId!: string;

  private fb = inject(FormBuilder);
  private beneficiarioProyectoService = inject(BeneficiarioProyectoService);
  private router = inject(Router);
  private beneficiarioService = inject(BeneficiaryService);
  private pageTitleService = inject(PageTitleService);
  private alert = inject(AlertService);

  beneficiarioInfo: IBeneficiarioUnique | null = null;
  proyectoNombre = '';

  form: FormGroup = this.fb.group({
    idBeneficiario: ['', [Validators.required]],
    idProyecto: ['', [Validators.required]],
    observaciones: [''],
    esBeneficiarioActivo: [true],
    fechaInicio: [''],
    fechaFin: [{ value: null, disabled: true }]
  });

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar Beneficiario en Proyecto');
    this.loadBeneficiarioProyecto();
  }

  private loadBeneficiarioProyecto(): void {
    this.beneficiarioProyectoService.getAllById(this.beneficiarioProyectoId).subscribe({
      next: (response) => {
        this.loadBeneficiarioInfo(response.idBeneficiario.toString());
        this.proyectoNombre = response.nombreProyecto; // 👈 directo del backend

        this.form.patchValue({
          idBeneficiario: response.idBeneficiario,
          idProyecto: response.idProyecto,
          observaciones: response.observaciones,
          esBeneficiarioActivo: response.esBeneficiarioActivo,
          fechaInicio: response.fechaInicio,
          fechaFin: response.fechaFin
        });

        this.form.get('fechaInicio')?.disable();
        this.form.get('idBeneficiario')?.disable();
        this.form.get('idProyecto')?.disable();
        this.form.get('fechaFin')?.disable();
      },
      error: (error) => {
        console.error('Error:', error);
        this.alert.error('Error servicio', 'Error al cargar los datos');
      }
    });
  }

  private loadBeneficiarioInfo(beneficiarioId: string): void {
    this.beneficiarioService.getById(beneficiarioId).subscribe({
      next: (response) => (this.beneficiarioInfo = response),
      error: (error) => console.error('Error:', error)
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = { ...this.form.getRawValue() };

      this.beneficiarioProyectoService.updateById(this.beneficiarioProyectoId, formData).subscribe({
        next: (response) => {
          if (response.idProyecto === 0) {
            this.alert.info('Informativo', response.observaciones);
          } else {
            this.alert.success('Operación exitosa', 'Actualización exitosa');
          }
          this.router.navigate(['/projects/add-beneficiary/list']);
        },
        error: (error) => {
          console.error('Error:', error);
          this.alert.error('Error del servicio', 'Error al actualizar');
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/projects/add-beneficiary/list']);
  }
}
