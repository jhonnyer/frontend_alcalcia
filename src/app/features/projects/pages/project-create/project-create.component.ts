import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

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

  ngOnInit(): void {
    this.initFormFamilyCore();

  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      categoria: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      estado: ['', [Validators.required]],
    });
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
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
