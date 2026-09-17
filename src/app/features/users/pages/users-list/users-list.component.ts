import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecretariaAdminService } from '../../../../core/services/secretaria-admin.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { ISecretaria } from '../../../../core/models/secretaria.model';
import { IResponsable } from '../../../../core/models/responsable.model';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { MatIconModule } from '@angular/material/icon';
import { TokenService } from '../../../../core/services/token.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: `./users-list.component.html`,
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent implements OnInit {
  private readonly secretariaAdminService = inject(SecretariaAdminService);
  private readonly responsibleService = inject(ResponsibleService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly tokenService = inject(TokenService);

  secretarias = signal<ISecretaria[]>([]);
  responsables = signal<IResponsable[]>([]);
  loading = signal(true);
  secretariaSearch = signal('');
  usuarioSearch = signal('');
  creatingSecretary = signal(false);
  secretaryModalOpen = signal(false);
  activeSecretaryName = signal('');
  editingActiveSecretary = signal(false);

  secretariaForm = this.fb.group({
    nombre: ['', [Validators.required]],
    codigo: ['', [Validators.required]],
    prefijoProducto: ['', [Validators.required]],
    estado: ['A', [Validators.required]]
  });

  activeSecretaryForm = this.fb.group({
    nombre: ['', [Validators.required]]
  });

  filteredSecretarias = computed(() => {
    const query = this.normalizeSearchText(this.secretariaSearch());
    return this.secretarias().filter(secretaria => {
      const text = this.normalizeSearchText(`${secretaria.idSecretaria} ${secretaria.nombre} ${secretaria.codigo} ${secretaria.estado}`);
      return !query || text.includes(query);
    });
  });

  filteredResponsables = computed(() => {
    const query = this.normalizeSearchText(this.usuarioSearch());
    return this.responsables().filter(responsable => {
      const text = this.normalizeSearchText(`${responsable.idResponsable} ${responsable.primerNombre} ${responsable.segundoNombre} ${responsable.primerApellido} ${responsable.segundoApellido} ${responsable.usuario} ${responsable.numeroIdentificacion} ${responsable.perfilUsuario} ${responsable.estado}`);
      return !query || text.includes(query);
    });
  });

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Gestión administrativa');
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.secretariaAdminService.getAll().subscribe({
      next: secretarias => {
        this.secretarias.set(secretarias);
        const activeId = this.tokenService.getActiveSecretaryId();
        const active = secretarias.find(secretaria => secretaria.idSecretaria === activeId);
        if (active) {
          this.activeSecretaryName.set(active.nombre);
          this.activeSecretaryForm.patchValue({ nombre: active.nombre });
        }
      },
      error: error => console.error('Error al cargar secretarías:', error)
    });
    this.responsibleService.getAll().subscribe({
      next: responsables => {
        this.responsables.set(responsables);
        this.loading.set(false);
      },
      error: error => {
        console.error('Error al cargar usuarios:', error);
        this.loading.set(false);
      }
    });
  }

  goToUsers(): void {
    this.router.navigate(['/resposibles']);
  }

  createSecretary(): void {
    if (this.secretariaForm.invalid) {
      this.secretariaForm.markAllAsTouched();
      return;
    }

    const formValue = this.secretariaForm.getRawValue();
    const payload = {
      nombre: String(formValue.nombre ?? '').trim(),
      codigo: String(formValue.codigo ?? '').trim(),
      prefijoProducto: String(formValue.prefijoProducto ?? '').trim(),
      estado: 'A'
    };

    this.creatingSecretary.set(true);
    this.secretariaAdminService.create(payload).subscribe({
      next: secretaria => {
        this.secretarias.update(secretarias => [...secretarias, secretaria]);
        this.secretariaForm.reset({ nombre: '', codigo: '', prefijoProducto: '', estado: 'A' });
        this.secretaryModalOpen.set(false);
        this.creatingSecretary.set(false);
      },
      error: error => {
        console.error('Error al crear secretaría:', error);
        this.creatingSecretary.set(false);
      }
    });
  }

  clearSecretariaSearch(): void {
    this.secretariaSearch.set('');
  }

  clearUsuarioSearch(): void {
    this.usuarioSearch.set('');
  }

  openSecretaryModal(): void {
    this.secretariaForm.reset({ nombre: '', codigo: '', prefijoProducto: '', estado: 'A' });
    this.secretaryModalOpen.set(true);
  }

  closeSecretaryModal(): void {
    if (!this.creatingSecretary()) {
      this.secretaryModalOpen.set(false);
    }
  }

  updateActiveSecretaryName(): void {
    if (this.activeSecretaryForm.invalid) {
      this.activeSecretaryForm.markAllAsTouched();
      return;
    }
    const nombre = String(this.activeSecretaryForm.getRawValue().nombre ?? '').trim();
    this.editingActiveSecretary.set(true);
    this.secretariaAdminService.updateActiveName(nombre).subscribe({
      next: secretaria => {
        this.activeSecretaryName.set(secretaria.nombre);
        this.secretarias.update(secretarias => secretarias.map(item =>
          item.idSecretaria === secretaria.idSecretaria ? secretaria : item
        ));
        this.editingActiveSecretary.set(false);
      },
      error: error => {
        console.error('Error al actualizar secretaría activa:', error);
        this.editingActiveSecretary.set(false);
      }
    });
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
}
