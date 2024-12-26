import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { Router } from '@angular/router';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { IBeneficiario } from '../../../../core/models/beneficiary.models';
import { IProyecto } from '../../../../core/models/proyecto.model';


@Component({
  selector: 'app-add-beneficiary-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-beneficiary-project.component.html',
  styleUrl: './add-beneficiary-project.component.scss',
})
export class AddBeneficiaryProjectComponent implements OnInit {
  private fb = inject(FormBuilder);
  private beneficiarioProyectoService = inject(BeneficiarioProyectoService);
  private router = inject(Router);
  private beneficiarioService = inject(BeneficiaryService);
  private proyectosService = inject(ProyectosService);

  beneficiarios: IBeneficiario[] = [];
  proyectos: IProyecto[] = [];

  form: FormGroup = this.fb.group({
    idBeneficiario: ['', [Validators.required]],
    idProyecto: ['', [Validators.required]],
    observaciones: [''],
    esBeneficiarioActivo: [true],
    fechaInicio: [this.getFechaActual()],
    fechaFin: [null]
  });

  ngOnInit(): void {
    this.loadBeneficiarios();
    this.loadProyectos();
  }

  private loadBeneficiarios(): void {
    this.beneficiarioService.getAll().subscribe({
      next: (beneficiarios) => {
        this.beneficiarios = beneficiarios;
      },
      error: (error) => {
        console.error('Error al cargar beneficiarios:', error);
        alert('Error al cargar la lista de beneficiarios');
      }
    });
  }

  private loadProyectos(): void {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        // Extraemos los proyectos de la respuesta
        this.proyectos = response.respuesta.map(item => item.proyecto);
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        alert('Error al cargar la lista de proyectos');
      }
    });
  }

  private getFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = this.form.value;

      this.beneficiarioProyectoService.post(formData).subscribe({
        next: (response) => {
          console.log('Asignación exitosa:', response);
          alert('Beneficiario asignado correctamente');
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          console.error('Error en la asignación:', error);
          alert('Error al asignar beneficiario al proyecto');
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}
