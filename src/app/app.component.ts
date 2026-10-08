import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'donaciones';
  private swUpdate = inject(SwUpdate, { optional: true });

  constructor() {
    if (!this.swUpdate?.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        Swal.fire({
          title: 'Nueva versión disponible',
          text: 'Recarga para usar la versión más reciente.',
          icon: 'info',
          confirmButtonText: 'Recargar ahora',
          showCancelButton: true,
          cancelButtonText: 'Después'
        }).then(result => {
          if (result.isConfirmed) document.location.reload();
        });
      });

    // Revisa si hay versión nueva cada 30 minutos
    setInterval(() => this.swUpdate?.checkForUpdate(), 30 * 60 * 1000);
  }
}
