import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoriasService } from '../../../core/services/categorias.service';
import { Router } from '@angular/router';
import { ICategorias } from './../../../core/models/categorias.model';
import { PageTitleService } from '../../../core/services/pageTitle.service';

@Component({
  selector: 'app-categorias-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './categorias-update.component.html'
})
export class CategoriasUpdateComponent implements OnInit {
  @Input('id') categoriaId!: string;

  // proyecto = signal<ICategorias| null>(null);
  private router = inject(Router);
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private categoriasService = inject(CategoriasService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar una categoría');
    this.initFormFamilyCore();
    this.getProyectoById();
  }

  getProyectoById(){
    this.categoriasService.getById(this.categoriaId).subscribe({
      next: response => {
        this.initProject(response);
      }
    })
  }

  private initProject(categoria: ICategorias){
    this.formFamilyCore.setValue({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
    }, { emitEvent: true })
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
    });
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      delete this.formFamilyCore.value.idNucleo;
      this.categoriasService.updateById(this.categoriaId, this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Se ha guardado correctamente el núcleo');
          this.router.navigate(["categorias"]);
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

  cancelar() {
    this.router.navigate(['/nucleo']);
  }
}
