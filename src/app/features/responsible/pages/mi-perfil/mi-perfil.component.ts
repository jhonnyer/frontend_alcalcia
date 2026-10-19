import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';
import { Perfil, PerfilService, perfilErrorMessage } from '../../../../core/services/perfil.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './mi-perfil.component.html',
})
export class MiPerfilComponent implements OnInit {
  private readonly service = inject(PerfilService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly alert = inject(AlertService);
  private readonly title = inject(PageTitleService);
  readonly perfil = signal<Perfil | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly changingPassword = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly passwordError = signal('');

  readonly form = this.fb.nonNullable.group({
    primerNombre: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/\S/)]],
    segundoNombre: ['', Validators.maxLength(50)],
    primerApellido: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/\S/)]],
    segundoApellido: ['', Validators.maxLength(50)],
    area: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    cargo: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), Validators.maxLength(100)]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{1,10}$/)]],
  });
  readonly passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/\S/)]],
    confirmarPassword: ['', Validators.required],
  });

  ngOnInit(): void {
    this.title.setCurrentPage('Mi perfil');
    this.load();
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');
    this.service.get().pipe(
      timeout(45000), takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)),
    ).subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.form.reset({
          primerNombre: perfil.primerNombre || '', segundoNombre: perfil.segundoNombre || '',
          primerApellido: perfil.primerApellido || '', segundoApellido: perfil.segundoApellido || '',
          area: perfil.area || '', cargo: perfil.cargo || '',
          email: perfil.email || '', telefono: perfil.telefono || '',
        });
      },
      error: error => {
        console.error('No se pudo cargar el perfil:', error);
        this.loadError.set(perfilErrorMessage(error));
      },
    });
  }

  save(): void {
    if (this.saving() || !this.perfil()) return;
    this.form.markAllAsTouched();
    this.saveError.set('');
    if (this.form.invalid) {
      this.saveError.set('Revisa los campos marcados antes de guardar.');
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue();
    this.service.update(payload).pipe(
      timeout(45000), takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)),
    ).subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.form.reset({
          primerNombre: perfil.primerNombre || '', segundoNombre: perfil.segundoNombre || '',
          primerApellido: perfil.primerApellido || '', segundoApellido: perfil.segundoApellido || '',
          area: perfil.area || '', cargo: perfil.cargo || '',
          email: perfil.email || '', telefono: perfil.telefono || '',
        });
        this.alert.success('Perfil actualizado', 'Tus datos personales se guardaron correctamente.');
      },
      error: error => {
        console.error('No se pudo actualizar el perfil:', error);
        this.saveError.set(perfilErrorMessage(error));
      },
    });
  }

  changePassword(): void {
    if (this.changingPassword()) return;
    this.passwordForm.markAllAsTouched();
    this.passwordError.set('');
    const payload = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || new TextEncoder().encode(payload.passwordNueva).length > 72) {
      this.passwordError.set('Completa los campos. La nueva contraseña debe tener al menos 8 caracteres y máximo 72 bytes.');
      return;
    }
    if (payload.passwordNueva !== payload.confirmarPassword) {
      this.passwordError.set('La confirmación de la contraseña no coincide.');
      return;
    }
    if (payload.passwordActual === payload.passwordNueva) {
      this.passwordError.set('La nueva contraseña debe ser diferente de la actual.');
      return;
    }
    this.changingPassword.set(true);
    this.service.changePassword(payload).pipe(
      timeout(45000), takeUntilDestroyed(this.destroyRef), finalize(() => this.changingPassword.set(false)),
    ).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.alert.success('Contraseña actualizada', 'Utiliza tu nueva contraseña la próxima vez que inicies sesión.');
      },
      error: error => {
        // Do not log the HTTP request: it contains credentials.
        this.passwordError.set(perfilErrorMessage(error));
      },
    });
  }
}
