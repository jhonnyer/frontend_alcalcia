import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { Router } from '@angular/router';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { IBeneficiario, IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';
import { IProyecto } from '../../../../core/models/proyecto.model';

import { debounceTime } from 'rxjs';
import { timer } from 'rxjs';

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

  beneficiarioNoEncontrado = false;
  beneficiario = signal<IBeneficiarioUnique | null>(null);

  searchBeneficiario = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(14),
    Validators.pattern('^[0-9]*$')
  ]);

  form: FormGroup = this.fb.group({
    idBeneficiario: ['', [Validators.required]],
    idProyecto: ['', [Validators.required]],
    observaciones: [''],
    esBeneficiarioActivo: [true],
    fechaInicio: [this.getFechaActual()],
    fechaFin: [null]
  });

  ngOnInit(): void {
    this.onSearchBeneficiario();
    this.loadProyectos();
  }


  onSearchBeneficiario() {
    this.searchBeneficiario.valueChanges
    .pipe(
      debounceTime(400)
    )
    .subscribe({
      next: (value: string | null) => {
        if (value && value.length >= 6) {
          this.beneficiarioService.getByCedula(value).subscribe({
            next: resp => {
              if (resp !== undefined) {
                this.beneficiario.set(resp);
                this.form.patchValue({
                  idBeneficiario: resp.idBeneficiario
                });
              } else {
                this.beneficiarioNoEncontrado = true;
                this.beneficiario.set(null);
                this.form.patchValue({
                  idBeneficiario: ''
                });
                timer(1500).subscribe(() => {
                  this.beneficiarioNoEncontrado = false;
                });
              }
            },
            error: error => {
              this.beneficiarioNoEncontrado = true;
              this.beneficiario.set(null);
              this.form.patchValue({
                idBeneficiario: ''
              });
              timer(2500).subscribe(() => {
                this.beneficiarioNoEncontrado = false;
              });
              console.error(error);
            }
          });
        }
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
          alert('Beneficiario asignado correctamente');
          this.router.navigate(['/projects/add-beneficiary/list']);
        },
        error: (error) => {
          console.error('Error en la asignación:', error);
          alert('Error al asignar beneficiario al proyecto. Es posible que un miembro del núcleo familiar ya esta asignado a un proyecto.');
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
