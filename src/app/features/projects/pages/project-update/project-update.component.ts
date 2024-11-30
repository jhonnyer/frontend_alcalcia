import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IProyecto, IProyectoAndCategoria } from '../../../../core/models/proyecto.model';

@Component({
  selector: 'app-project-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './project-update.component.html'
})
export class ProjectUpdateComponent implements OnInit {
  @Input('id') proyectoId!: string;

  // proyecto = signal<IProyecto| null>(null);
  private router = inject(Router);
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private proyectosService = inject(ProyectosService);


  ngOnInit(): void {
    // console.log("proyectoId", this.proyectoId)
    this.initFormFamilyCore();
    this.getProyectoById();
  }

  getProyectoById(){
    this.proyectosService.getById(this.proyectoId).subscribe({
      next: response => {
        this.initProject(response.respuesta.proyecto);
      }
    })
  }

  private initProject(proyecto: IProyecto){
    this.formFamilyCore.setValue({
      nombre: proyecto.nombre,
      tipoProyecto: proyecto.tipoProyecto,
      fechaInicio: proyecto.fechaInicio,
      fechaFin: proyecto.fechaFin,
      estado: proyecto.estado,
      descripcion: proyecto.descripcion
    }, { emitEvent: true })
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      tipoProyecto: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: [''],
      estado: ['A', [Validators.required]],
      descripcion: [''],
    });
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      const zona = Number(this.formFamilyCore.get("idZonaFk")?.value);
      const barrio = Number(this.formFamilyCore.get("idZonaFk")?.value);

      this.formFamilyCore.patchValue({
        numeroIntegrantes: null,
        idZonaFk: zona,
        idBarrioFk: barrio
      });

      delete this.formFamilyCore.value.idNucleo;


      this.proyectosService.updateById(this.proyectoId, this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Se ha guardado correctamente el núcleo');
          this.router.navigate(["projects"]);
        },
        error: error => {
          alert('Ha ocurrido un error al cargar los datos');
        }
      })
	  }else
    {
      alert('Verifica los campos de tu formulario');
      this.formFamilyCore.markAllAsTouched();
    }
  }
}
