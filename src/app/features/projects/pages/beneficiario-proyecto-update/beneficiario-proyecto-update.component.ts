import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';
import { IProyecto } from '../../../../core/models/proyecto.model';

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
  private proyectosService = inject(ProyectosService);
  private beneficiarioService = inject(BeneficiaryService);
  private pageTitleService = inject(PageTitleService);

  beneficiarioInfo: IBeneficiarioUnique | null = null;
    proyectos: IProyecto[] = [];

  form: FormGroup = this.fb.group({
    idBeneficiario: ['', [Validators.required]],
    idProyecto: ['', [Validators.required]],
    observaciones: [''],
    esBeneficiarioActivo: [true],
    fechaInicio: [''],
    fechaFin: [null]
  });

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar Beneficiario en Proyecto');
    this.loadProyectos();
    this.loadBeneficiarioProyecto();
  }

  private loadBeneficiarioProyecto(): void {
    this.beneficiarioProyectoService.getAllById(this.beneficiarioProyectoId).subscribe({
      next: (response) => {
        this.loadBeneficiarioInfo(response.idBeneficiario.toString());
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
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Error al cargar los datos');
      }
    });
  }

  private loadBeneficiarioInfo(beneficiarioId: string): void {
    this.beneficiarioService.getById(beneficiarioId).subscribe({
      next: (response) => {
        this.beneficiarioInfo = response;
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  private loadProyectos(): void {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        this.proyectos = response.respuesta.map(item => item.proyecto);
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = {
        ...this.form.value,
        idBeneficiario: this.form.get('idBeneficiario')?.getRawValue(),
        fechaInicio: this.form.get('fechaInicio')?.getRawValue()
      };

      this.beneficiarioProyectoService.updateById(this.beneficiarioProyectoId, formData).subscribe({
        next: () => {
          alert('Actualización exitosa');
          this.router.navigate(['/projects/add-beneficiary/list']);
        },
        error: (error) => {
          console.error('Error:', error);
          alert('Error al actualizar');
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
