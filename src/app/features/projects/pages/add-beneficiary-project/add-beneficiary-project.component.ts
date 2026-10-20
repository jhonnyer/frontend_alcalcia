import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { Router } from '@angular/router';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';
import { IProyecto } from '../../../../core/models/proyecto.model';

import { EMPTY, catchError, finalize, switchMap, timer, timeout } from 'rxjs';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly proyectos = signal<IProyecto[]>([]);
  readonly searchingBeneficiary = signal(false);
  readonly loadingProjects = signal(false);
  readonly saving = signal(false);
  readonly beneficiaryError = signal('');
  readonly projectError = signal('');
  private confirmedDocument = '';
  projectSearch = signal('');
  projectSuggestionsVisible = signal(false);
  filteredProjects = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    const selected = this.proyectos().find(project => project.idProyecto === this.form.get('idProyecto')?.value);
    if (selected && query === this.normalizeSearchText(`#${selected.idProyecto} - ${selected.nombre}`)) {
      return this.proyectos();
    }
    return this.proyectos().filter(project => {
      const text = this.normalizeSearchText(`${project.idProyecto} ${project.nombre} ${project.descripcion}`);
      return !query || text.includes(query);
    });
  });

  beneficiario = signal<IBeneficiarioUnique | null>(null);

  searchBeneficiario = new FormControl('', { nonNullable: true, validators: [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(40),
    Validators.pattern('^[a-zA-Z0-9-\\s]*$')
  ] });

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


  onSearchBeneficiario(): void {
    this.searchBeneficiario.valueChanges.pipe(
      switchMap(value => {
        this.beneficiario.set(null);
        this.confirmedDocument = '';
        this.form.patchValue({ idBeneficiario: '' });
        this.beneficiaryError.set('');
        this.searchingBeneficiary.set(false);
        const document = value.trim();
        if (this.searchBeneficiario.invalid || document.length < 3) return EMPTY;
        this.searchingBeneficiary.set(true);
        // Cancelar de inmediato la consulta anterior, incluido su tiempo de espera.
        return timer(400).pipe(
          switchMap(() => this.beneficiarioService.getByCedula(document).pipe(timeout(15000))),
          catchError((error: unknown) => {
            console.error('No se pudo consultar el beneficiario:', error);
            this.beneficiaryError.set(error instanceof HttpErrorResponse && error.status === 404
              ? 'No se encontró un beneficiario con este documento en el contexto actual.'
              : 'No se pudo verificar el beneficiario. Reintenta la búsqueda antes de guardar.');
            return EMPTY;
          }),
          finalize(() => this.searchingBeneficiary.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (!response?.idBeneficiario || response.numeroDocumento?.trim().toUpperCase()
          !== this.searchBeneficiario.value.trim().toUpperCase()) {
        this.beneficiaryError.set('La consulta no confirmó un beneficiario con el documento indicado.');
        return;
      }
      this.beneficiario.set(response);
      this.confirmedDocument = this.searchBeneficiario.value.trim();
      this.form.patchValue({ idBeneficiario: response.idBeneficiario });
    });
  }

  loadProyectos(): void {
    if (this.loadingProjects()) return;
    this.loadingProjects.set(true);
    this.projectError.set('');
    this.proyectosService.getAll().pipe(
      timeout(15000),
      finalize(() => this.loadingProjects.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        // Filtramos solo los proyectos activos
        this.proyectos.set(response.respuesta
          .map(item => item.proyecto)
          .filter(p => p.estado === 'A'));
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.projectError.set('No se pudieron cargar los proyectos. Reintenta para continuar.');
      }
    });
  }

  private getFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.canSave) {
      const formData = this.form.value;
      this.saving.set(true);
      this.form.disable({ emitEvent: false });
      this.searchBeneficiario.disable({ emitEvent: false });
      this.beneficiarioProyectoService.post(formData).pipe(
        finalize(() => {
          this.saving.set(false);
          this.form.enable({ emitEvent: false });
          this.searchBeneficiario.enable({ emitEvent: false });
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
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
      if (this.saving()) return;
      this.form.markAllAsTouched();
      this.searchBeneficiario.markAsTouched();
      this.alert.warning('Revisa la asignación', 'Completa el formulario y verifica un beneficiario existente antes de guardar.');
    }
  }

  get canSave(): boolean {
    const beneficiary = this.beneficiario();
    return this.form.valid && this.searchBeneficiario.valid
      && !this.saving() && !this.searchingBeneficiary() && !this.loadingProjects()
      && !this.beneficiaryError() && !this.projectError()
      && !!beneficiary?.idBeneficiario
      && this.confirmedDocument === this.searchBeneficiario.value.trim()
      && this.form.get('idBeneficiario')?.value === beneficiary.idBeneficiario
      && this.proyectos().some(project => project.idProyecto === this.form.get('idProyecto')?.value);
  }

  retryBeneficiary(): void {
    if (!this.saving()) this.searchBeneficiario.updateValueAndValidity();
  }

  cancel(): void {
    if (this.saving()) return;
    this.router.navigate(['/projects/add-beneficiary/list']);
  }

  onProjectSearch(event: Event): void {
    if (this.saving()) return;
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.projectSuggestionsVisible.set(true);
    this.form.patchValue({ idProyecto: '' });
  }

  selectProject(project: IProyecto): void {
    if (this.saving()) return;
    this.projectSearch.set(`#${project.idProyecto} - ${project.nombre}`);
    this.form.patchValue({ idProyecto: project.idProyecto });
    this.projectSuggestionsVisible.set(false);
  }

  clearProjectFilter(): void {
    if (this.saving()) return;
    this.projectSearch.set('');
    this.form.patchValue({ idProyecto: '' });
    this.projectSuggestionsVisible.set(false);
  }

  showProjectSuggestions(): void {
    if (this.saving()) return;
    this.projectSuggestionsVisible.set(true);
  }

  hideProjectSuggestions(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    if (!(event.relatedTarget instanceof Node) || !container.contains(event.relatedTarget)) {
      this.projectSuggestionsVisible.set(false);
    }
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
}
