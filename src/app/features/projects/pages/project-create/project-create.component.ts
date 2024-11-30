import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private proyectosService = inject(ProyectosService);
  private router = inject(Router);

  ngOnInit(): void {
    this.initFormFamilyCore();

  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      tipoProyecto: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: [''],
      estado: ['A', [Validators.required]],
      descripcion: [''],
    });
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  onSubmit() {
    console.log("Proyectos: ", this.formFamilyCore.value)
    if(this.formFamilyCore.valid){
      this.proyectosService.post(this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Se ha guardado correctamente el proyecto');
          this.router.navigate(["projects"]);
        },
        error: error => {
          alert('Ha ocurrido un error al cargar los datos');
        }
      })
	  }else{
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
