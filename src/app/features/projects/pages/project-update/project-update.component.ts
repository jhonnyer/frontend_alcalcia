import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

import { ProyectosService } from '../../../../core/services/proyectos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

import { IProyecto, IProyectoAndCategoria } from '../../../../core/models/proyecto.model';
import { ICategorias } from '../../../../core/models/categorias.model';

@Component({
  selector: 'app-project-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styles: ``,
  templateUrl: './project-update.component.html'
})
export class ProjectUpdateComponent implements OnInit {
  @Input('id') proyectoId!: string;

  public formFamilyCore: FormGroup = new FormGroup({});
  categorias = signal<ICategorias[]>([]);

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private proyectosService = inject(ProyectosService);
  private categoriasService = inject(CategoriasService);
  private pageTitleService = inject(PageTitleService);


  ngOnInit(): void {
    this.pageTitleService.setCurrentPage("Actualizar Proyecto");
    this.initFormFamilyCore();
    this.getAllCategorias();
    this.getProyectoById();
  }

  private getAllCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: response => {
        this.categorias.set(response);
      },
      error: error => {
        console.error("Error al cargar categorías:", error);
      }
    });
  }

  private getProyectoById(): void {
    this.proyectosService.getById(this.proyectoId).subscribe({
      next: response => {
        const { proyecto, categorias } = response.respuesta;
        this.initProject(proyecto, categorias);
      },
      error: error => {
        console.error("Error al cargar proyecto:", error);
        alert('Error al cargar los datos del proyecto');
      }
    });
  }

  private initProject(proyecto: IProyecto, categorias: ICategorias[]): void {
    this.formFamilyCore.patchValue({
      nombre: proyecto.nombre,
      tipoProyecto: proyecto.tipoProyecto,
      fechaInicio: proyecto.fechaInicio,
      fechaFin: proyecto.fechaFin,
      estado: proyecto.estado,
      descripcion: proyecto.descripcion,
      categorias: categorias.map(cat => ({ idCategoria: cat.idCategoria }))
    });

    // Pre-seleccionar categorías existentes
    setTimeout(() => {
      categorias.forEach(cat => {
        const checkbox = document.querySelector(
          `input[type="checkbox"][value="${cat.idCategoria}"]`
        ) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    });
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      tipoProyecto: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: [''],
      estado: ['', [Validators.required]],
      descripcion: [''],
      categorias: [[]]
    });
  }

  onCategoryCheckboxChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const value = Number(checkbox.value);
    const categoriaControl = this.formFamilyCore.get('categorias');
    let selectedCategories: { idCategoria: number }[] = categoriaControl?.value || [];

    if (checkbox.checked) {
      selectedCategories.push({ idCategoria: value });
    } else {
      selectedCategories = selectedCategories.filter(
        category => category.idCategoria !== value
      );
    }

    categoriaControl?.setValue(selectedCategories);
  }

  private getTransformedData(): IProyectoAndCategoria {
    const formValue = this.formFamilyCore.value;
    return {
      proyecto: {
        idProyecto: Number(this.proyectoId),
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        estado: formValue.estado,
        fechaInicio: formValue.fechaInicio,
        fechaFin: formValue.fechaFin,
        tipoProyecto: formValue.tipoProyecto,
      },
      categorias: formValue.categorias || []
    };
  }

  onSubmit(): void {
    if (this.formFamilyCore.valid) {
      const dataToSend = this.getTransformedData();
      this.proyectosService.updateById(this.proyectoId, dataToSend).subscribe({
        next: response => {
          alert('Se ha actualizado correctamente el proyecto');
          this.router.navigate(["projects"]);
        },
        error: error => {
          console.error('Error:', error);
          alert('Ha ocurrido un error al actualizar los datos');
        }
      });
    } else {
      alert('Verifica los campos de tu formulario');
      this.formFamilyCore.markAllAsTouched();
    }
  }

  cancelar(): void {
    this.router.navigate(["projects"]);
  }
}
