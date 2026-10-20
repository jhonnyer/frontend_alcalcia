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
import { finalize } from 'rxjs';

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
  private cdRef = inject(ChangeDetectorRef);

  public formFamilyCore: FormGroup = new FormGroup({});
  private originalPassword: string = '';
  private initialAccessState: IResponsable['estado'] | undefined;
  public loading = false;
  public saving = false;
  public loadError = false;

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
    this.loading = true;
    this.loadError = false;
    this.responsibleService.getByParams(this.responsableId.toString()).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response) => this.initResponsable(response),
      error: (err) => {
        console.error('Error al cargar responsable:', err);
        this.loadError = true;
        this.alert.error('No se pudo cargar el usuario', 'Reintenta la consulta antes de actualizar.');
      },
    });
  }

  private initResponsable(responsable: IResponsable): void {
    this.originalPassword = responsable.password || '';
    this.initialAccessState = responsable.estadoCuenta === 'I' ? 'I' : responsable.estado;
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
        estado: this.initialAccessState,
        perfilUsuario: responsable.perfilUsuario,
        password: ''
      },
      { emitEvent: true }
    );
  }

  // Confirmación antes de guardar
  async onSubmit(): Promise<void> {
    if (this.saving || this.loading || this.loadError) return;
    if (!this.formFamilyCore.valid) {
      this.formFamilyCore.markAllAsTouched();

      this.alert.warning('Revisa el formulario', 'Verifica los campos antes de continuar.');
      return;
    }

    const data = { ...this.formFamilyCore.value };

    // Si está en modo edición y el usuario no cambió la contraseña
    if (!this.modoCreacion && (!data.password || data.password === this.originalPassword)) {
      delete data.password;
    }
    const stateChanged = !this.modoCreacion && data.estado !== this.initialAccessState;
    // No recalcular ni reactivar la cuenta al guardar cambios de otros campos.
    if (!this.modoCreacion && !stateChanged) delete data.estado;

    const mensajeConfirmacion = this.modoCreacion
      ? '¿Desea registrar un nuevo responsable?'
      : stateChanged
        ? `¿Desea actualizar el usuario y ${data.estado === 'A' ? 'activar' : 'inactivar'} su acceso a esta secretaría?${data.estado === 'A' ? ' Activar este acceso también puede reactivar la cuenta.' : ''}`
        : '¿Desea actualizar la información del usuario? Su estado se conservará sin cambios.';
    this.saving = true;
    this.formFamilyCore.disable({ emitEvent: false });
    const confirmado = await this.alert.confirm(
      this.modoCreacion ? 'Crear usuario' : 'Actualizar usuario',
      mensajeConfirmacion, 'Sí, guardar', 'Cancelar'
    );
    if (!confirmado) {
      this.saving = false;
      this.formFamilyCore.enable({ emitEvent: false });
      return;
    }

    const peticion = this.modoCreacion
      ? this.responsibleService.post(data)
      : this.responsibleService.updateById(
          this.responsableId!.toString(),
          data
        );

    peticion.pipe(finalize(() => {
      this.saving = false;
      this.formFamilyCore.enable({ emitEvent: false });
    })).subscribe({
      next: () => {
        this.alert.success('Operación exitosa', 'La información del usuario se guardó correctamente.');
        if (this.modalMode) {
          this.saved.emit();
          return;
        }
        this.router.navigate(['resposibles']);
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        this.alert.error('No se pudo guardar', 'Ocurrió un error al guardar la información. Intenta nuevamente.');
      },
    });
  }

  async cancelar(): Promise<void> {
    if (this.saving) return;
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
