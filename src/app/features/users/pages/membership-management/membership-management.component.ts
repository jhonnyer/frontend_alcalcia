import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { IMembresiaResponsable, IResponsableMembresias, ISecretaria } from '../../../../core/models/secretaria.model';
import { SecretariaAdminService } from '../../../../core/services/secretaria-admin.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from '../../../../core/services/alert.service';
import { A11yModule } from '@angular/cdk/a11y';

type AccionMembresia = 'agregar' | 'cambiar';

@Component({
  selector: 'app-membership-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, A11yModule],
  templateUrl: './membership-management.component.html',
})
export class MembershipManagementComponent {
  private readonly service = inject(SecretariaAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly pageTitle = inject(PageTitleService);
  private readonly alert = inject(AlertService);

  readonly responsables = signal<IResponsableMembresias[]>([]);
  readonly secretarias = signal<ISecretaria[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly successMessage = signal('');
  readonly search = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly selectedId = signal<number | null>(null);
  readonly formVisible = signal(false);
  readonly selectedResponsable = computed(() =>
    this.responsables().find(responsable => responsable.idResponsable === this.selectedId()) ?? null
  );
  readonly filteredResponsables = computed(() => {
    const query = this.normalize(this.search());
    return this.responsables().filter(responsable => {
      const text = this.normalize([
        responsable.idResponsable,
        responsable.primerNombre,
        responsable.segundoNombre,
        responsable.primerApellido,
        responsable.segundoApellido,
        responsable.usuario,
        responsable.numeroIdentificacion,
        responsable.email,
        responsable.area,
        responsable.cargo,
      ].join(' '));
      return !query || text.includes(query);
    }).sort((first, second) =>
      this.normalize(`${first.primerApellido} ${first.primerNombre}`)
        .localeCompare(this.normalize(`${second.primerApellido} ${second.primerNombre}`))
    );
  });
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredResponsables().length / this.pageSize()))
  );
  readonly paginatedResponsables = computed(() => {
    const page = Math.min(this.pageIndex(), this.totalPages() - 1);
    const start = page * this.pageSize();
    return this.filteredResponsables().slice(start, start + this.pageSize());
  });
  readonly firstVisibleIndex = computed(() =>
    this.filteredResponsables().length ? this.pageIndex() * this.pageSize() + 1 : 0
  );
  readonly lastVisibleIndex = computed(() =>
    Math.min((this.pageIndex() + 1) * this.pageSize(), this.filteredResponsables().length)
  );
  readonly activeMemberships = computed(() =>
    this.selectedResponsable()?.membresias.filter(membresia => membresia.estado === 'A') ?? []
  );

  readonly form = this.fb.nonNullable.group({
    accion: this.fb.nonNullable.control<AccionMembresia>('agregar'),
    idSecretaria: ['', Validators.required],
    idSecretariaOrigen: [''],
    rol: this.fb.nonNullable.control<'ADMIN' | 'RESP'>('RESP', Validators.required),
  });

  constructor() {
    this.pageTitle.setCurrentPage('Gestión de membresías');
    this.loadData();
  }

  loadData(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');
    forkJoin({
      responsables: this.service.getResponsablesWithMemberships(),
      secretarias: this.service.getAll(),
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ responsables, secretarias }) => {
        this.responsables.set(responsables);
        this.pageIndex.update(page => Math.min(page, this.totalPages() - 1));
        this.secretarias.set(secretarias.filter(secretaria => secretaria.estado === 'A'));
        if (this.selectedId() !== null && !responsables.some(item => item.idResponsable === this.selectedId())) {
          this.selectedId.set(null);
        }
      },
      error: error => {
        console.error('No se pudo cargar la gestión de membresías:', error);
        this.loadError.set(this.errorMessage(error));
      },
    });
  }

  selectResponsable(responsable: IResponsableMembresias): void {
    if (this.saving() || this.loading()) return;
    this.selectedId.set(responsable.idResponsable);
    this.clearForm();
    this.formVisible.set(false);
  }

  closeManagement(): void {
    if (this.saving() || this.loading()) return;
    this.clearForm();
    this.formVisible.set(false);
    this.selectedId.set(null);
  }

  openForm(accion: AccionMembresia): void {
    if (this.saving() || this.loading()) return;
    this.clearForm();
    this.form.controls.accion.setValue(accion);
    this.updateOriginValidators();
    this.formVisible.set(true);
  }

  cancelForm(): void {
    if (this.saving() || this.loading()) return;
    this.clearForm();
    this.formVisible.set(false);
  }

  async activateMembership(membresia: IMembresiaResponsable): Promise<void> {
    if (this.saving() || this.loading() || membresia.estado === 'A') return;
    this.clearForm();
    this.form.patchValue({ idSecretaria: String(membresia.idSecretaria), rol: membresia.rol });
    await this.submit();
  }

  clearForm(): void {
    if (this.saving() || this.loading()) return;
    this.form.reset({ accion: 'agregar', idSecretaria: '', idSecretariaOrigen: '', rol: 'RESP' });
    this.updateOriginValidators();
    this.saveError.set('');
    this.successMessage.set('');
  }

  canSubmit(): boolean {
    const { accion, idSecretaria, idSecretariaOrigen } = this.form.getRawValue();
    return this.form.valid
      && !this.saving()
      && !this.loading()
      && !this.loadError()
      && this.selectedResponsable() !== null
      && !this.isActiveMembership(Number(idSecretaria))
      && (accion !== 'cambiar' || (idSecretariaOrigen !== '' && idSecretariaOrigen !== idSecretaria));
  }

  isActiveMembership(idSecretaria: number): boolean {
    return this.activeMemberships().some(membresia => membresia.idSecretaria === idSecretaria);
  }

  async submit(): Promise<void> {
    if (this.saving() || this.loading()) return;
    this.saveError.set('');
    this.successMessage.set('');
    this.form.markAllAsTouched();
    if (!this.canSubmit()) {
      this.saveError.set('Completa los datos y verifica que las secretarías sean diferentes.');
      return;
    }
    const responsable = this.selectedResponsable();
    if (!responsable) return;

    const { accion, idSecretaria, idSecretariaOrigen, rol } = this.form.getRawValue();
    const idDestino = Number(idSecretaria);
    const destino = this.secretarias().find(secretaria => secretaria.idSecretaria === idDestino);
    const origen = this.activeMemberships().find(membresia => membresia.idSecretaria === Number(idSecretariaOrigen));
    if (!destino || (accion === 'cambiar' && !origen)) {
      this.saveError.set('Verifica las secretarías seleccionadas antes de continuar.');
      return;
    }
    const reactivacion = responsable.membresias.some(
      membresia => membresia.idSecretaria === idDestino && membresia.estado !== 'A'
    );
    const nombre = `${responsable.primerNombre} ${responsable.primerApellido}`;
    const rolNombre = rol === 'ADMIN' ? 'Administrador' : 'Responsable';
    const mensaje = accion === 'cambiar'
      ? `Se desactivará la vinculación de ${nombre} con ${origen?.nombreSecretaria} y se activará su acceso a ${destino.nombre} con rol ${rolNombre}. Las demás membresías se conservarán.`
      : `Se ${reactivacion ? 'reactivará' : 'activará'} el acceso de ${nombre} a ${destino.nombre} con rol ${rolNombre}. Sus otras membresías se conservarán.`;

    this.saving.set(true);
    let confirmed: boolean;
    try {
      confirmed = await this.alert.confirm(
        accion === 'cambiar' ? 'Confirmar cambio de secretaría' : 'Confirmar activación de vínculo',
        mensaje,
        accion === 'cambiar' ? 'Sí, cambiar' : 'Sí, activar',
        'Cancelar'
      );
    } catch (error) {
      this.saving.set(false);
      console.error('No se pudo confirmar la actualización de la membresía:', error);
      this.saveError.set('No se pudo abrir la confirmación. Intenta nuevamente.');
      return;
    }
    if (!confirmed) {
      this.saving.set(false);
      return;
    }

    const request = accion === 'cambiar'
      ? this.service.changeResponsibleSecretary(idDestino, responsable.idResponsable, {
          rol,
          idSecretariaOrigen: Number(idSecretariaOrigen),
        })
      : this.service.assignResponsible(idDestino, responsable.idResponsable, { rol });

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formVisible.set(false);
        this.form.reset({ accion: 'agregar', idSecretaria: '', idSecretariaOrigen: '', rol: 'RESP' });
        this.updateOriginValidators();
        this.successMessage.set(accion === 'cambiar'
          ? 'Se cambió la secretaría del responsable.'
          : 'Se asignó una secretaría adicional al responsable.');
        this.loadData();
      },
      error: error => {
        console.error('No se pudo actualizar la membresía del responsable:', error);
        this.saveError.set(this.errorMessage(error));
      },
    });
  }

  async deactivateMembership(membresia: IMembresiaResponsable): Promise<void> {
    const responsable = this.selectedResponsable();
    if (!responsable || membresia.estado !== 'A' || this.saving() || this.loading() || this.loadError()) return;
    this.saving.set(true);
    let confirmed: boolean;
    try {
      const lastMembershipWarning = this.activeMemberships().length === 1
        ? ' Es su última membresía activa: quedará sin acceso a las secretarías hasta que se le asigne una nuevamente.'
        : ' Sus otras membresías conservarán el acceso.';
      confirmed = await this.alert.confirm(
        'Desactivar acceso a la secretaría',
        `¿Desactivar la vinculación de ${responsable.primerNombre} ${responsable.primerApellido} con ${membresia.nombreSecretaria}? No se eliminarán su cuenta ni sus registros.${lastMembershipWarning}`,
        'Sí, desactivar',
        'Cancelar'
      );
    } catch (error) {
      this.saving.set(false);
      console.error('No se pudo confirmar la desactivación de la membresía:', error);
      this.saveError.set('No se pudo abrir la confirmación. Intenta nuevamente.');
      return;
    }
    if (!confirmed) {
      this.saving.set(false);
      return;
    }

    this.saveError.set('');
    this.successMessage.set('');
    this.service.deactivateResponsibleMembership(membresia.idSecretaria, responsable.idResponsable)
      .pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => {
          this.formVisible.set(false);
          this.form.reset({ accion: 'agregar', idSecretaria: '', idSecretariaOrigen: '', rol: 'RESP' });
          this.updateOriginValidators();
          this.successMessage.set(`Se desactivó el acceso a ${membresia.nombreSecretaria}.`);
          this.loadData();
        },
        error: error => {
          console.error('No se pudo desactivar la membresía:', error);
          this.saveError.set(this.errorMessage(error));
        },
      });
  }

  membershipLabel(membresia: IMembresiaResponsable): string {
    return `${membresia.nombreSecretaria} (${membresia.rol === 'ADMIN' ? 'Administrador' : 'Responsable'})`;
  }

  activeMembershipCount(responsable: IResponsableMembresias): number {
    return responsable.membresias.filter(membresia => membresia.estado === 'A').length;
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  updatePageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.pageIndex.set(0);
  }

  previousPage(): void {
    this.pageIndex.update(page => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.pageIndex.update(page => Math.min(this.totalPages() - 1, page + 1));
  }

  private updateOriginValidators(): void {
    const control = this.form.controls.idSecretariaOrigen;
    if (this.form.controls.accion.value === 'cambiar') {
      control.setValidators(Validators.required);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (body && typeof body === 'object' && 'mensaje' in body && typeof body.mensaje === 'string') {
        return body.mensaje;
      }
      if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
        return body.message;
      }
      return 'No se pudo completar la operación. Revisa tu conexión y vuelve a intentar.';
    }
    return error instanceof Error ? error.message : 'No se pudo completar la operación.';
  }
}
