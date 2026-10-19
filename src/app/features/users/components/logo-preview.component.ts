import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { AlertService } from '../../../core/services/alert.service';
import { Subscription } from 'rxjs';
import { DefaultLogoCache } from '../../../core/services/default-logo.service';

@Component({
  selector: 'app-logo-preview',
  standalone: true,
  template: `
    @if (!logo) {
      <p class="mt-2 text-xs text-slate-500">Logo institucional predeterminado</p>
    }
    @if (loading) {
      <p class="my-3 text-xs text-slate-500" role="status">Cargando logo predeterminado...</p>
    }
    @if (loadError) {
      <div class="my-3 text-xs text-red-700" role="status">
        No se pudo cargar el logo predeterminado.
        <button type="button" class="ml-2 font-semibold underline" (click)="ngOnChanges()">Reintentar</button>
      </div>
    }
    @if (downloadUrl) {
      <div class="my-3 rounded-lg border border-slate-200 bg-white p-3">
        <img class="h-24 max-w-full object-contain" [src]="downloadUrl" alt="Logo institucional seleccionado" (error)="onImageError()" />
        <div class="mt-2 flex flex-wrap items-start gap-3">
          <a class="rounded-md text-xs font-semibold text-blue-700 underline hover:text-blue-900"
             [href]="downloadUrl" [download]="fileName">Descargar logo</a>
        </div>
      </div>
    }
  `,
})
export class LogoPreviewComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) logo = '';
  downloadUrl = '';
  fileName = '';
  loading = false;
  loadError = false;
  private readonly alert = inject(AlertService);
  private readonly defaultLogo = inject(DefaultLogoCache);
  private readonly cdr = inject(ChangeDetectorRef);
  private defaultRequest?: Subscription;

  ngOnChanges(): void {
    this.defaultRequest?.unsubscribe();
    this.releaseUrl();
    this.loadError = false;
    this.loading = false;
    if (!this.logo) {
      this.loading = true;
      this.defaultRequest = this.defaultLogo.image$.subscribe({
        next: blob => {
          this.downloadUrl = URL.createObjectURL(blob);
          this.fileName = 'logo-predeterminado.png';
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.loadError = true;
          this.cdr.markForCheck();
          this.alert.error('No se pudo cargar el logo predeterminado', 'Verifica la conexión y que el backend esté actualizado. Puedes reintentar desde la vista previa.');
        },
      });
      return;
    }
    try {
      const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(this.logo);
      if (!match) throw new Error('El logo guardado no tiene un formato PNG o JPEG válido.');
      this.downloadUrl = this.logo;
      this.fileName = `logo-secretaria.${match[1] === 'jpeg' ? 'jpg' : 'png'}`;
    } catch (error) {
      this.alert.error('No se pudo previsualizar el logo', error instanceof Error ? error.message : 'Revisa la imagen seleccionada.');
    }
  }

  ngOnDestroy(): void {
    this.defaultRequest?.unsubscribe();
    this.releaseUrl();
  }

  onImageError(): void {
    this.alert.error('No se pudo mostrar el logo', 'La imagen no se pudo leer. Verifica el archivo y vuelve a seleccionarlo.');
  }

  private releaseUrl(): void {
    if (this.downloadUrl.startsWith('blob:')) URL.revokeObjectURL(this.downloadUrl);
    this.downloadUrl = '';
  }
}
