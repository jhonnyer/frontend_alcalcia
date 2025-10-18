import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly pageTitleService = inject(PageTitleService);

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);

  public isLoading = false; 

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
          alert('Inicio de sesión exitoso');
        },
        error: error=> {
          this.isLoading = false; // 🔹 Desactiva el loading incluso si falla
          alert('Verifica tus credenciales con un administrador');
        }
      })
	  }else{
		  this.formFamilyCore.markAllAsTouched();
	  }
  }


}
