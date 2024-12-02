import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-beneficiary-register',
  standalone: true,
  imports: [
    CommonModule ,ReactiveFormsModule
  ],
  styles: ``,
  templateUrl: './beneficiary-register.component.html'
})
export class BeneficiaryRegisterComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.initFormFamilyCore();
    this.pageTitleService.setCurrentPage('Registro de beneficiario');
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      zona: ['', [Validators.required]],
      barrio: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      nombreNucleo: ['', [Validators.required]],
      beneficiarios: this.fb.array([])
    });
    this.addBeneficiary();
  }

  initFormBeneficiary(): FormGroup {
    // Retorna el formulario que estará anidado
    return this.fb.group({
      nombre1: ['', [Validators.required]],
      nombre2: ['', [Validators.required]],
      apellido1: ['', [Validators.required]],
      apellido2: ['', [Validators.required]],
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      victimaConflico: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      edad: ['', [Validators.required]],
      etnia: ['', [Validators.required]],
      email: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
    });
  }

  //Agrega un nuevo formulario anidado de Persona
  addBeneficiary(): void {
    const refBeneficiary = this.formFamilyCore.get('beneficiarios') as FormArray;
    refBeneficiary.push(this.initFormBeneficiary());
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  get beneficiariosFormArray(): FormArray {
    return this.formFamilyCore.get('beneficiarios') as FormArray;
  }

  deletePerson(index: number): void {
    const beneficiariosArray = this.formFamilyCore.get('beneficiarios') as FormArray;
    beneficiariosArray.removeAt(index);
  }


  onSubmit() {
    if(this.formFamilyCore.valid){
      console.log("Form Family Core");
      console.log(this.formFamilyCore.value);
	  }else{
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
