import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatIcon,
    MatProgressSpinner
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly pageTitleService = inject(PageTitleService);

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private alert = inject(AlertService);

  public isLoading = false; 

  showPassword = false;

  ngOnInit(): void {
    this.initFormFamilyCore();
    this.pageTitleService.setCurrentPage('Login');
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      this.isLoading = true; //
      this.authService.login(this.formFamilyCore.value).subscribe({
        next: response => {
          this.isLoading = false; // 🔹 Desactiva el loading
          this.alert.success('Inicio de sesión exitoso', 'Sesión iniciada exitosamente');      
        },
        error: error=> {
          this.isLoading = false; // 🔹 Desactiva el loading incluso si falla
          this.alert.error('Error inicio de sesión','Verifica tus credenciales con un administrador')
        }
      })
	  }else{
		  this.formFamilyCore.markAllAsTouched();
	  }
  }

togglePasswordVisibility(): void {
  this.showPassword = !this.showPassword;
}

}
