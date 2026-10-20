import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { IResponsable } from '../../../../core/models/responsable.model';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { AlertService } from '../../../../core/services/alert.service';
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
  @Input() modalMode = false;
  @Input() responsableIdInput: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  responsableId?: number;
  modoCreacion = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private responsibleService = inject(ResponsibleService);
  private pageTitleService = inject(PageTitleService);
  private alert = inject(AlertService);
  private dialog = inject(MatDialog);
  private cdRef = inject(ChangeDetectorRef);

  public formFamilyCore: FormGroup = new FormGroup({});
  private originalPassword: string = '';
  public estadoCuenta: IResponsable['estadoCuenta'];

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (!this.modalMode) return;
    void this.cancelar();
  }

  ngOnInit(): void {
    // Inicializa el formulario base
    this.initFormFamilyCore();

    if (this.modalMode) {
      this.initializeMode(this.responsableIdInput != null ? String(this.responsableIdInput) : 'nuevo');
      return;
    }

    // Evita que Angular reutilice el componente al navegar
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    // Detecta si estás editando o creando
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.initializeMode(id);
    });
  }

  private initializeMode(id: string | null): void {
    const password = this.formFamilyCore.get('password');
    if (id && id !== 'nuevo') {
      password?.clearValidators();
    } else {
      password?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    password?.updateValueAndValidity({ emitEvent: false });
    if (id && id !== 'nuevo') {
      // MODO EDICIÓN
      this.modoCreacion = false;
      this.responsableId = +id;
      this.cargarResponsable();
      this.pageTitleService.setCurrentPage('Actualizar responsable');
    } else {
      this.modoCreacion = true;
      this.responsableId = undefined;
      this.pageTitleService.setCurrentPage('Registrar responsable');

      // Espera un ciclo de render y luego limpia el formulario completamente
      setTimeout(() => {
        this.formFamilyCore.reset();

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
          usuario: '',
          telefono: '',
          estado: 'A',
          perfilUsuario: 'RESP',
          password: ''
        });

        this.originalPassword = '';
        this.cdRef.detectChanges();
      }, 0);
    }
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
    this.estadoCuenta = responsable.estadoCuenta;
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
        ? this.responsibleService.post(data)
        : this.responsibleService.updateById(
            this.responsableId!.toString(),
            data
          );

      peticion.subscribe({
        next: () => {
          if (this.modalMode) {
            this.saved.emit();
            return;
          }
          this.router.navigate(['resposibles']);
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

  async cancelar(): Promise<void> {
    if (this.modalMode) {
      if (this.formFamilyCore.dirty) {
        const confirmed = await this.alert.confirm(
          'Descartar cambios',
          'Tienes cambios sin guardar. ¿Deseas cerrar este formulario?',
          'Sí, cerrar',
          'Seguir editando'
        );
        if (!confirmed) return;
      }
      this.closed.emit();
      return;
    }
    this.router.navigate(['resposibles']);
  }
}
