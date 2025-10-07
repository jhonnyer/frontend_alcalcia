import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { IResponsable } from '../../../../core/models/responsable.model';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-responsible-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './responsible-update.component.html',
  styles: ``,
})
export class ResponsibleUpdateComponent implements OnInit {
  responsableId?: number;
  modoCreacion = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private responsibleService = inject(ResponsibleService);
  private pageTitleService = inject(PageTitleService);
  private dialog = inject(MatDialog);
  private cdRef = inject(ChangeDetectorRef);

  public formFamilyCore: FormGroup = new FormGroup({});
  private originalPassword: string = '';

  ngOnInit(): void {
    // Evita que Angular reutilice el componente al navegar
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    // Inicializa el formulario base
    this.initFormFamilyCore();

    // Detecta si estás editando o creando
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id && id !== 'nuevo') {
        // MODO EDICIÓN
        this.modoCreacion = false;
        this.responsableId = +id;
        this.cargarResponsable();
        this.pageTitleService.setCurrentPage('Actualizar responsable');
      } else {
        this.modoCreacion = true;
        this.pageTitleService.setCurrentPage('Registrar responsable');

        // 🔹 Espera un ciclo de render y luego limpia el formulario completamente
        setTimeout(() => {
          this.formFamilyCore.reset();

          // 🔹 Reasigna valores por defecto (vacíos)
          this.formFamilyCore.patchValue({
            idResponsable: '',
            primerNombre: '',
            segundoNombre: '',
            primerApellido: '',
            segundoApellido: '',
            tipoIdentificacion: '',
            numeroIdentificacion: '',
            area: '',
            cargo: '',
            email: '',
            usuario: '', // 👈 limpia el usuario
            telefono: '',
            estado: 'A',
            perfilUsuario: 'RESP',
            password: '' // 👈 limpia la contraseña
          });

          // 🔹 Limpia referencia de contraseña anterior
          this.originalPassword = '';

          // 🔹 Fuerza actualización visual
          this.cdRef.detectChanges();
        }, 0);
      } 
    });
  }


  // Inicializa el formulario
  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      idResponsable: [''],
      primerNombre: ['', [Validators.required]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required]],
      segundoApellido: [''],
      tipoIdentificacion: ['', [Validators.required]],
      numeroIdentificacion: ['', [Validators.required]],
      area: ['', [Validators.required]],
      cargo: ['', [Validators.required]],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/),
        ],
      ],
      usuario: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      perfilUsuario: ['', [Validators.required]],
      password: [''],
    });
  }

  // Cargar datos si se edita
  cargarResponsable(): void {
    if (!this.responsableId) return;

    this.responsibleService.getByParams(this.responsableId.toString()).subscribe({
      next: (response) => this.initResponsable(response),
      error: (err) => console.error('Error al cargar responsable:', err),
    });
  }

  private initResponsable(responsable: IResponsable): void {
    this.originalPassword = responsable.password || '';
    this.formFamilyCore.patchValue(
      {
        idResponsable: responsable.idResponsable,
        primerNombre: responsable.primerNombre,
        segundoNombre: responsable.segundoNombre,
        primerApellido: responsable.primerApellido,
        segundoApellido: responsable.segundoApellido,
        tipoIdentificacion: responsable.tipoIdentificacion,
        numeroIdentificacion: responsable.numeroIdentificacion,
        area: responsable.area,
        cargo: responsable.cargo,
        email: responsable.email,
        usuario: responsable.usuario,
        telefono: responsable.telefono,
        estado: responsable.estado,
        perfilUsuario: responsable.perfilUsuario,
        password: ''
      },
      { emitEvent: true }
    );
  }

  // Confirmación antes de guardar
  onSubmit(): void {
    if (this.formFamilyCore.invalid) {
      this.formFamilyCore.markAllAsTouched();

      this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          mensaje: '⚠️ Verifica los campos del formulario antes de continuar.',
        },
      });
      return;
    }

    const data = { ...this.formFamilyCore.value };

    // Si está en modo edición y el usuario no cambió la contraseña
    if (!this.modoCreacion && (!data.password || data.password === this.originalPassword)) {
      delete data.password;
    }

    const mensajeConfirmacion = this.modoCreacion
      ? '¿Desea registrar un nuevo responsable?'
      : '¿Desea actualizar la información del usuario?';

    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: mensajeConfirmacion },
    });

    confirmRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;

      // Selecciona la acción según el modo
      const peticion = this.modoCreacion
        ? this.responsibleService.post(this.formFamilyCore.value)
        : this.responsibleService.updateById(
            this.responsableId!.toString(),
            this.formFamilyCore.value
          );

      peticion.subscribe({
        next: () => {
          this.router.navigate(['resposibles'])
        },
        error: (error) => {
          console.error('Error al guardar:', error);
          this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: {
              mensaje:
                '⚠️ Ocurrió un error al guardar la información. Intente nuevamente.',
            },
          });
        },
      });
    });
  }

  cancelar(): void {
    this.router.navigate(['resposibles']);
  }
}
