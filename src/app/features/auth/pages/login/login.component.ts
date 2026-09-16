import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { AlertService } from '../../../../core/services/alert.service';
import { IResponseLogin, ISecretariaAcceso } from '../../../../core/models/responseLogin.model';
import { TokenService } from '../../../../core/services/token.service';

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
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private alert = inject(AlertService);

  public isLoading = false; 
  public secretarias: ISecretariaAcceso[] = [];
  public requiresSecretarySelection = false;
  public credentialsValidated = false;

  showPassword = false;

  ngOnInit(): void {
    this.initFormFamilyCore();
    this.pageTitleService.setCurrentPage('Login');
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required]],
      idSecretaria: [null],
    });
  }

  onSubmit() {
    if (this.requiresSecretarySelection) {
      this.selectSecretary();
      return;
    }

    if(this.formFamilyCore.valid){
      this.isLoading = true; //
      const credentials = {
        usuario: this.formFamilyCore.get('usuario')?.value,
        password: this.formFamilyCore.get('password')?.value
      };
      this.authService.login(credentials).subscribe({
        next: response => {
          this.secretarias = response.secretarias ?? [];

          if (this.secretarias.length > 1) {
            this.tokenService.saveLoginResponse(response, true);
            this.requiresSecretarySelection = true;
            this.credentialsValidated = true;
            this.formFamilyCore.get('idSecretaria')?.setValue(null);
            this.isLoading = false;
            return;
          }

          this.tokenService.saveLoginResponse(response);
          this.finishLogin(response);
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

  selectSecretary(): void {
    const idSecretaria = this.formFamilyCore.get('idSecretaria')?.value;
    if (!idSecretaria) {
      this.alert.error('Secretaría requerida', 'Selecciona una secretaría para continuar');
      this.formFamilyCore.get('idSecretaria')?.markAsTouched();
      return;
    }

    const selectedSecretaryId = Number(idSecretaria);
    this.isLoading = true;
    this.authService.changeSecretary(selectedSecretaryId).subscribe({
      next: response => {
        if (response.idSecretaria !== selectedSecretaryId) {
          this.isLoading = false;
          this.alert.error('Secretaría no confirmada', 'El servidor no confirmó la secretaría seleccionada');
          return;
        }
        this.finishLogin(response);
      },
      error: () => {
        this.isLoading = false;
        this.alert.error('Error de secretaría', 'No tienes acceso a la secretaría seleccionada');
      }
    });
  }

  private finishLogin(response: IResponseLogin): void {
    this.tokenService.saveLoginResponse(response);
    this.requiresSecretarySelection = false;
    this.credentialsValidated = false;
    this.isLoading = false;

    if (response.estadoUser === 'A') {
      this.alert.success('Inicio de sesión exitoso', 'Sesión iniciada exitosamente');
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/user-inactive']);
    }
  }

togglePasswordVisibility(): void {
  this.showPassword = !this.showPassword;
}

}
