import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ImportacionMasivaService } from '../../../../core/services/importacion-masiva.service';
import { AlertService } from '../../../../core/services/alert.service';
import {
  ImportacionError,
  ImportacionFila,
  ImportacionResultado,
} from '../../../../core/models/importacion-masiva.model';

@Component({
  selector: 'app-importacion-masiva',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './importacion-masiva.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportacionMasivaComponent {
  private readonly service = inject(ImportacionMasivaService);
  private readonly alert = inject(AlertService);

  readonly resultado = signal<ImportacionResultado | null>(null);
  readonly filas = signal<ImportacionFila[]>([]);
  readonly errores = signal<ImportacionError[]>([]);
  readonly archivoNombre = signal('');
  readonly cargando = signal(false);
  readonly editando = signal(false);

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith('.csv')) {
      this.alert.error('Archivo no valido', 'Selecciona un archivo CSV UTF-8.');
      input.value = '';
      return;
    }

    this.archivoNombre.set(archivo.name);
    this.cargando.set(true);
    this.service.simular(archivo).subscribe({
      next: response => {
        this.aplicarRespuesta(response.respuesta);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudo validar el archivo', this.mensajeError(error));
      },
    });
  }

  guardarCorrecciones(): void {
    const resultado = this.resultado();
    if (!resultado) return;

    this.cargando.set(true);
    this.service.actualizar(resultado.importacionId, {
      versionDatos: resultado.versionDatos,
      filas: this.filas(),
    }).subscribe({
      next: response => {
        this.aplicarRespuesta(response.respuesta);
        this.editando.set(false);
        this.cargando.set(false);
        this.alert.success('Cambios validados', 'La importacion quedo lista para confirmar.');
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudieron guardar los cambios', this.mensajeError(error));
      },
    });
  }

  confirmar(): void {
    const resultado = this.resultado();
    if (!resultado || this.errores().length > 0) return;

    this.cargando.set(true);
    this.service.confirmar(resultado.importacionId, resultado.versionDatos).subscribe({
      next: response => {
        this.aplicarRespuesta(response.respuesta);
        this.cargando.set(false);
        this.alert.success('Carga confirmada', 'Los nucleos y beneficiarios fueron creados.');
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudo confirmar la carga', this.mensajeError(error));
      },
    });
  }

  agregarFila(): void {
    this.filas.update(filas => [...filas, {
      numeroFila: filas.length + 2,
      actorRef: '',
      nombreNucleo: '',
      direccion: '',
      idZona: null,
      idBarrio: null,
      beneficiarioPrimerNombre: '',
      beneficiarioPrimerApellido: '',
      tipoDocumento: '',
      numeroDocumento: '',
      fechaNacimiento: '',
      telefono: '',
      email: '',
    }]);
    this.editando.set(true);
  }

  eliminarFila(index: number): void {
    this.filas.update(filas => filas.filter((_, filaIndex) => filaIndex !== index));
    this.editando.set(true);
  }

  errorDe(fila: ImportacionFila, campo: string): string | null {
    const error = this.errores().find(item =>
      item.numeroFila === fila.numeroFila && item.campo === campo
    );
    return error?.mensaje ?? null;
  }

  tieneError(fila: ImportacionFila, campo: string): boolean {
    return this.errorDe(fila, campo) !== null;
  }

  descargarPlantilla(): void {
    const contenido = [
      'actor_ref,nombre_nucleo,direccion,id_zona,id_barrio,beneficiario_primer_nombre,beneficiario_primer_apellido,tipo_documento,numero_documento,fecha_nacimiento,telefono,email',
      'AS-001,Fundacion Luz de Vida,Calle 10 # 5-20,3,12,Maria,Gomez,CC,1032456789,1992-04-15,3001234567,maria.gomez@email.com',
    ].join('\n');
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    enlace.download = 'plantilla-actores-sociales.csv';
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  reiniciar(): void {
    this.resultado.set(null);
    this.filas.set([]);
    this.errores.set([]);
    this.archivoNombre.set('');
    this.editando.set(false);
  }

  private aplicarRespuesta(resultado: ImportacionResultado): void {
    this.resultado.set(resultado);
    this.filas.set(resultado.filas ?? []);
    this.errores.set(resultado.errores ?? []);
  }

  private mensajeError(error: any): string {
    return error?.error?.mensaje ?? error?.error?.message ?? 'Revisa la respuesta del servidor.';
  }
}
