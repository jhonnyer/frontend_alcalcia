import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MyValidators } from '../../../../core/utils/validators';
import { Router } from '@angular/router';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, MatProgressSpinner],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private responsibleService = inject(ResponsibleService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  public isLoading = false; 
  public secretarias: { idSecretaria: number; nombre: string }[] = [];
  private alert = inject(AlertService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Registro de usuario');
    this.initFormFamilyCore();
    this.authService.getPublicSecretarias().subscribe({
      next: (lista) => {
        this.secretarias = lista;
        if (lista.length === 1) {
          this.formFamilyCore.patchValue({ idSecretaria: lista[0].idSecretaria });
        }
      },
      error: () => this.alert.error('Error', 'No se pudieron cargar las secretarías.'),
    });
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      primerNombre: ['', [Validators.required]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required]],
      segundoApellido: [''],
      tipoIdentificacion: ['CC', [Validators.required]],
      numeroIdentificacion: ['', [Validators.required]],
      idSecretaria: [null, [Validators.required]],
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
      this.isLoading = true; 
      const { confirmPassword, estado, perfilUsuario, ...payload } = this.formFamilyCore.value;
      this.authService.register(payload).subscribe({
        next: response => {
          this.isLoading = false; 
          this.alert.success('Registro exitoso', 'Contacta al administrador para activar tu cuenta.');      
          this.router.navigate(['auth']);
        },
        error: (err) => {
          this.isLoading = false;
          this.alert.error('Error al registrar', err?.error?.mensaje || 'Intenta nuevamente o contacta al administrador.');
        }
      })
	  }else{
      this.isLoading = false; 
      this.alert.warning('Formulario incompleto', 'Verifica los campos requeridos antes de continuar.');
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
