import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-responsible-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './responsible-create.component.html'
})
export class ResponsibleCreateComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Crear responsable');
    this.initFormFamilyCore();
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      primerNombre: ['', [Validators.required]],
      segundoNombre: ['', [Validators.required]],
      primerApellido: ['', [Validators.required]],
      segundoApellido: ['', [Validators.required]],
      tipoIdentificacion: ['cc', [Validators.required]],
      numeroIdentificacion: ['', [Validators.required]],
      area: ['', [Validators.required]],
      cargo: ['', [Validators.required]],
      email: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      estado: ['I', [Validators.required]],
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required]],
      perfilUsuario: ['', [Validators.required]],
    });
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      // console.log(this.formFamilyCore.value);
	  }else{
		  this.formFamilyCore.markAllAsTouched();
	  }
  }

  cancelar() {
    console.log('Cancelar');
  }
}
