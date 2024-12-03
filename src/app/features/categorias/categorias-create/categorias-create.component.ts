import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoriasService } from '../../../core/services/categorias.service';
import { Router } from '@angular/router';
import { PageTitleService } from '../../../core/services/pageTitle.service';

@Component({
  selector: 'app-categorias-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './categorias-create.component.html'
})
export class CategoriasCreateComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private categoriasService = inject(CategoriasService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Crear una categoría');
    this.initFormFamilyCore();
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
    });
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      this.categoriasService.post(this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Se ha guardado correctamente la categoría');
          this.router.navigate(["categorias"]);
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
