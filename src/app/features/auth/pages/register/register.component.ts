import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';
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
import { MatIconModule } from '@angular/material/icon';

type RegistrationSection = 'personal' | 'access' | 'institution';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, MatProgressSpinner, MatIconModule],
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
  private readonly destroyRef = inject(DestroyRef);
  loadingSecretarias = false;
  secretariasError = '';
  readonly registrationSections: { key: RegistrationSection; title: string }[] = [
    { key: 'personal', title: 'Información personal' },
    { key: 'access', title: 'Datos de acceso' },
    { key: 'institution', title: 'Vinculación institucional' },
  ];
  private readonly sectionFields: Record<RegistrationSection, string[]> = {
    personal: ['primerNombre', 'primerApellido', 'tipoIdentificacion', 'numeroIdentificacion', 'telefono'],
    access: ['usuario', 'email', 'password', 'confirmPassword'],
    institution: ['idSecretaria', 'area', 'cargo'],
  };

  isSectionComplete(section: RegistrationSection): boolean {
    return this.sectionFields[section].every(name => {
      const control = this.formFamilyCore.get(name);
      return control?.valid && control.value != null && String(control.value).trim().length > 0;
    }) && (section !== 'access' || !this.formFamilyCore.hasError('match_password'));
  }

  goToSection(section: RegistrationSection): void {
    document.getElementById(`register-${section}-section`)?.scrollIntoView({ block: 'start' });
    document.querySelector<HTMLElement>(`#register-${section}-section input, #register-${section}-section select`)?.focus({ preventScroll: true });
  }

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Registro de usuario');
    this.initFormFamilyCore();
    this.loadSecretarias();
  }

  loadSecretarias(): void {
    if (this.loadingSecretarias) return;
    this.loadingSecretarias = true;
    this.secretariasError = '';
    this.authService.getPublicSecretarias().pipe(
      timeout(45000),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingSecretarias = false),
    ).subscribe({
      next: (lista) => {
        this.secretarias = lista;
        if (lista.length === 1) {
          this.formFamilyCore.patchValue({ idSecretaria: lista[0].idSecretaria });
        }
      },
      error: error => {
        console.error('No se pudieron cargar las secretarías del registro:', error);
        this.secretariasError = 'No se pudieron cargar las secretarías. Verifica la conexión e intenta nuevamente.';
      },
    });
  }

  invalidField(name: string): boolean {
    const control = this.formFamilyCore.get(name);
    return !!control && control.touched && control.invalid;
  }

  get passwordMismatch(): boolean {
    return !!this.formFamilyCore.get('confirmPassword')?.touched
      && this.formFamilyCore.hasError('match_password');
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
      email: ['', [Validators.required, Validators.email]],
      usuario: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(10)]],
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
    if (this.isLoading || this.loadingSecretarias || !this.secretarias.length) return;
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
