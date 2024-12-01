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
      console.log("Form Family Core");
      console.log(this.formFamilyCore.value);
      this.authService.login(this.formFamilyCore.value).subscribe({
        next: response => {
          console.log(response);
          alert('Inicio de sesión exitoso');
        },
        error: error=> {
          alert('Verifica tus credenciales con un administrador');
          console.log("Error en el servicio")
        }
      })
	  }else{
      console.log("Form Error");
      console.log(this.formFamilyCore.value);
		  this.formFamilyCore.markAllAsTouched();
	  }
  }


}
