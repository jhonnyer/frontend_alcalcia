import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { Router } from '@angular/router';
import { ICategorias } from '../../../../core/models/categorias.model';
import { IProyectoAndCategoria } from '../../../../core/models/proyecto.model';

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
  private readonly categoriasService = inject(CategoriasService);
  categorias = signal<ICategorias[]>([]);

  ngOnInit(): void {
    this.initFormFamilyCore();
    this.getAllCategorias();
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      tipoProyecto: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: [''],
      estado: ['A', [Validators.required]],
      descripcion: [''],
      categorias: [''],
    });
  }

  getAllCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: response => {
        console.log("Categorias: ", response)
        this.categorias.set(response);
      },
      error: error => {
        console.log("Error: ", error)
      }
    })
  }

  onCategoryCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const value = Number(checkbox.value);

    const categoriaControl = this.formFamilyCore.get('categorias');
    let selectedCategories: { idCategoria: number }[] = categoriaControl?.value || [];

    if (checkbox.checked) {
      // Agregar el objeto al array
      selectedCategories.push({ idCategoria: value });
    } else {
      // Eliminar el objeto correspondiente
      selectedCategories = selectedCategories.filter(category => category.idCategoria !== value);
    }

    categoriaControl?.setValue(selectedCategories);
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  getTransformedData() {
    const formValue = this.formFamilyCore.value;

    // Transformamos los datos del formulario al nuevo formato
    const transformedData = {
      proyecto: {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        estado: formValue.estado,
        fechaInicio: formValue.fechaInicio,
        fechaFin: formValue.fechaFin,
        tipoProyecto: formValue.tipoProyecto,
      },
      categorias: formValue.categorias, // Se asume que ya tienes las categorías como un array de objetos
    };

    return transformedData;
  }

  onSubmit() {
    console.log("Proyectos: ", this.formFamilyCore.value)
    if(this.formFamilyCore.valid){
      console.log("Valido: ", this.formFamilyCore.value);
      const dataToSend = this.getTransformedData() as IProyectoAndCategoria;
      console.log("Transformado: ", dataToSend);
      this.proyectosService.post(dataToSend).subscribe({
        next: response => {
          alert('Se ha guardado correctamente el proyecto');
          this.router.navigate(["projects"]);
        },
        error: error => {
          alert('Ha ocurrido un error al cargar los datos');
          console.log(error)
        }
      })
	  }else{
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
