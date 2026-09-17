import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { AlertService } from '../../../../core/services/alert.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-beneficiary-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './add-beneficiary-project.component.html',
  styleUrl: './add-beneficiary-project.component.scss',
})
export class AddBeneficiaryProjectComponent implements OnInit {
  private fb = inject(FormBuilder);
  private beneficiarioProyectoService = inject(BeneficiarioProyectoService);
  private router = inject(Router);
  private beneficiarioService = inject(BeneficiaryService);
  private proyectosService = inject(ProyectosService);
  private alert = inject(AlertService);

  beneficiarios: IBeneficiario[] = [];
  proyectos: IProyecto[] = [];
  projectSearch = signal('');
  projectSuggestionsVisible = signal(false);
  filteredProjects = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    return this.proyectos.filter(project => {
      const text = this.normalizeSearchText(`${project.idProyecto} ${project.nombre} ${project.descripcion}`);
      return !query || text.includes(query);
    });
  });

  beneficiarioNoEncontrado = false;
  beneficiario = signal<IBeneficiarioUnique | null>(null);

  searchBeneficiario = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(40),
    Validators.pattern('^[a-zA-Z0-9-\\s]*$') 
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
        // 🔹 Si el input está vacío, limpiamos el beneficiario y salimos
        if (!value || value.trim() === '') {
          this.beneficiario.set(null);
          this.form.patchValue({ idBeneficiario: '' });
          this.beneficiarioNoEncontrado = false;
          return;
        }
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
        // Filtramos solo los proyectos activos
        this.proyectos = response.respuesta
          .map(item => item.proyecto)
          .filter(p => p.estado === 'A');
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.alert.error('Error servicio','Error al cargar la lista de proyectos');
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
          this.alert.success('Operación exitosa','Beneficiario asignado correctamente');
          this.router.navigate(['/projects/add-beneficiary/list']);
        },
        error: (error) => {
          console.error('Error en la asignación:', error);

          let mensajeBackend = 'Error al asignar beneficiario al proyecto.';

          if (error.error?.mensaje) {
            mensajeBackend = error.error.mensaje;
          } else if (typeof error.error === 'string') {
            mensajeBackend = error.error;
          }

          this.alert.error('Operación fallida', mensajeBackend);
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/projects/add-beneficiary/list']);
  }

  onProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.projectSuggestionsVisible.set(true);
    this.form.patchValue({ idProyecto: '' });
  }

  selectProject(project: IProyecto): void {
    this.projectSearch.set(`#${project.idProyecto} - ${project.nombre}`);
    this.form.patchValue({ idProyecto: project.idProyecto });
    this.projectSuggestionsVisible.set(false);
  }

  clearProjectFilter(): void {
    this.projectSearch.set('');
    this.form.patchValue({ idProyecto: '' });
    this.projectSuggestionsVisible.set(false);
  }

  showProjectSuggestions(): void {
    this.projectSuggestionsVisible.set(true);
  }

  hideProjectSuggestions(): void {
    setTimeout(() => this.projectSuggestionsVisible.set(false), 150);
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
}
