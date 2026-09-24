import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ImportacionMasivaService } from '../../../../core/services/importacion-masiva.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ImportacionPendiente } from '../../../../core/models/importacion-masiva.model';

@Component({
  selector: 'app-gestionar-cargas',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './gestionar-cargas.component.html',
})
export class GestionarCargasComponent implements OnInit {
  private readonly service = inject(ImportacionMasivaService);
  private readonly alert = inject(AlertService);
  readonly cargas = signal<ImportacionPendiente[]>([]);
  readonly cargando = signal(true);

  ngOnInit(): void {
    this.service.pendientes().subscribe({
      next: response => {
        this.cargas.set(response.respuesta ?? []);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudieron consultar las cargas', error?.error?.mensaje ?? 'Intenta nuevamente.');
      },
    });
  }
}
