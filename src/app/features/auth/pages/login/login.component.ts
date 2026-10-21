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
          const allSecretarias = response.secretarias ?? [];
          const activeSecretarias = allSecretarias.filter(secretaria => this.isSecretaryActive(secretaria));

          if (response.rol !== 'SUPERADMIN') {
            if (!activeSecretarias.length) {
              this.isLoading = false;
              this.alert.error(
                'Secretaría inactiva',
                'Tu cuenta no tiene una secretaría activa para operar. Contacta al SuperAdmin.'
              );
              return;
            }

            const responseWithActiveSecretarias: IResponseLogin = {
              ...response,
              secretarias: activeSecretarias,
            };

            if (activeSecretarias.length > 1) {
              this.secretarias = activeSecretarias;
              this.tokenService.saveLoginResponse(responseWithActiveSecretarias, true);
              this.requiresSecretarySelection = true;
              this.credentialsValidated = true;
              this.formFamilyCore.get('idSecretaria')?.setValue(null);
              this.isLoading = false;
              return;
            }

            const onlyActiveSecretary = activeSecretarias[0];
            if (response.idSecretaria !== onlyActiveSecretary.idSecretaria) {
              this.secretarias = activeSecretarias;
              this.changeSecretaryForLogin(onlyActiveSecretary.idSecretaria);
              return;
            }

            this.tokenService.saveLoginResponse(responseWithActiveSecretarias);
            this.finishLogin(responseWithActiveSecretarias);
            return;
          }

          this.secretarias = allSecretarias;
          this.tokenService.saveLoginResponse(response);
          this.finishLogin(response);
        },
        error: error=> {
          this.isLoading = false; // 🔹 Desactiva el loading incluso si falla
          const backendMessage = typeof error?.error?.message === 'string'
            ? error.error.message
            : typeof error?.error?.mensaje === 'string'
              ? error.error.mensaje
              : typeof error?.error === 'string'
                ? error.error
                : '';
          const normalized = backendMessage.toLocaleLowerCase();
          if (normalized.includes('secretar') && normalized.includes('inactiv')) {
            this.alert.error('Secretaría inactiva', 'No puedes iniciar sesión porque la secretaría está inactiva.');
            return;
          }
          this.alert.error('Error inicio de sesión', backendMessage || 'Verifica tus credenciales con un administrador')
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
    const selectedSecretary = this.secretarias.find(secretaria => secretaria.idSecretaria === selectedSecretaryId);
    if (!selectedSecretary) {
      this.alert.error('Secretaría no válida', 'Selecciona una secretaría disponible.');
      return;
    }
    if (!this.isSecretaryActive(selectedSecretary)) {
      this.alert.error('Secretaría inactiva', 'La secretaría seleccionada está inactiva. Contacta al SuperAdmin.');
      return;
    }

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
      error: error => {
        this.isLoading = false;
        const backendMessage = typeof error?.error?.message === 'string'
          ? error.error.message
          : typeof error?.error?.mensaje === 'string'
            ? error.error.mensaje
          : typeof error?.error === 'string'
            ? error.error
            : '';
        if (backendMessage.toLocaleLowerCase().includes('inactiv')) {
          this.alert.error('Secretaría inactiva', 'La secretaría seleccionada está inactiva. Contacta al SuperAdmin.');
          return;
        }
        this.alert.error('Error de secretaría', 'No tienes acceso a la secretaría seleccionada');
      }
    });
  }

  private changeSecretaryForLogin(idSecretaria: number): void {
    this.isLoading = true;
    this.authService.changeSecretary(idSecretaria).subscribe({
      next: response => {
        if (response.idSecretaria !== idSecretaria) {
          this.isLoading = false;
          this.alert.error('Secretaría no confirmada', 'El servidor no confirmó la secretaría activa.');
          return;
        }
        this.tokenService.saveLoginResponse(response);
        this.finishLogin(response);
      },
      error: error => {
        this.isLoading = false;
        const backendMessage = typeof error?.error?.message === 'string'
          ? error.error.message
          : typeof error?.error?.mensaje === 'string'
            ? error.error.mensaje
          : typeof error?.error === 'string'
            ? error.error
            : '';
        if (backendMessage.toLocaleLowerCase().includes('inactiv')) {
          this.alert.error('Secretaría inactiva', 'La única secretaría disponible para tu usuario está inactiva.');
          return;
        }
        this.alert.error('Error de secretaría', 'No fue posible activar la secretaría de tu usuario.');
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
      const role = (this.tokenService.getUserRole() ?? '').trim().toUpperCase().replace(/^ROLE_/, '');
      this.router.navigate([role === 'SUPERADMIN' ? '/users' : '/home']);
    } else {
      this.router.navigate(['/user-inactive']);
    }
  }

  cancelSecretarySelection(): void {
    this.tokenService.clearToken();
    this.secretarias = [];
    this.requiresSecretarySelection = false;
    this.credentialsValidated = false;
    this.formFamilyCore.reset();
  }

  goToRegister(): void {
    this.cancelSecretarySelection();
    this.router.navigate(['/auth/register']);
  }

togglePasswordVisibility(): void {
  this.showPassword = !this.showPassword;
}

private isSecretaryActive(secretaria: ISecretariaAcceso): boolean {
  return (secretaria.estado ?? 'A') === 'A';
}

}
