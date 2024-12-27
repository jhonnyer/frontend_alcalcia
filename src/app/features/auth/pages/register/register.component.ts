import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MyValidators } from '../../../../core/utils/validators';
import { Router } from '@angular/router';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private responsibleService = inject(ResponsibleService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Registro de usuario');
    this.initFormFamilyCore();
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      primerNombre: ['', [Validators.required]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required]],
      segundoApellido: [''],
      tipoIdentificacion: ['cc', [Validators.required]],
      numeroIdentificacion: ['', [Validators.required]],
      area: ['', [Validators.required]],
      cargo: ['', [Validators.required]],
      email: ['', [Validators.required]],
      usuario: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      password: ['', [Validators.required]],
      confirmPassword : ['', [Validators.required]],
      estado: ['I', [Validators.required]],
      perfilUsuario: ['RESP', [Validators.required]],
    },{
      validators: [MyValidators.matchPasswords]
    });
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      delete this.formFamilyCore.value.confirmPassword;
      this.responsibleService.post(this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Tu perfil se ha creado correctamente, debes contactar un administrador para activar tu cuenta');
          this.router.navigate(['auth']);
        }
      })
	  }else{
      alert('Verifica los campos del formulario de registro');
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
