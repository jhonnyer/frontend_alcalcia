import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ImportacionMasivaService } from '../../../../core/services/importacion-masiva.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ZonaService } from '../../../../core/services/zona.service';
import { IZona } from '../../../../core/models/zona.models';
import { IBarrio } from '../../../../core/models/barrio.model';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly zonaService = inject(ZonaService);

  readonly resultado = signal<ImportacionResultado | null>(null);
  readonly filas = signal<ImportacionFila[]>([]);
  readonly errores = signal<ImportacionError[]>([]);
  readonly archivoNombre = signal('');
  readonly cargando = signal(false);
  readonly descargandoPlantilla = signal(false);
  readonly editando = signal(false);
  readonly filtro = signal('');
  readonly pagina = signal(0);
  readonly tamanoPagina = 25;
  readonly zonas = signal<IZona[]>([]);
  private readonly barriosPorZona = signal<Map<number, IBarrio[]>>(new Map());

  readonly erroresLocales = computed(() => this.filas().flatMap(fila => this.camposInvalidos(fila)));

  private camposInvalidos(fila: ImportacionFila): string[] {
    const errores: string[] = [];
    if (!fila.actorRef?.trim()) errores.push('actor_ref');
    if (!fila.nombreNucleo?.trim()) errores.push('nombre_nucleo');
    if (!fila.direccion?.trim()) errores.push('direccion');
    if (!fila.idZona || fila.idZona <= 0) errores.push('id_zona');
    if (!fila.idBarrio || fila.idBarrio <= 0) errores.push('id_barrio');
    if (!fila.beneficiarioPrimerNombre?.trim()) errores.push('beneficiario_primer_nombre');
    if (!fila.beneficiarioPrimerApellido?.trim()) errores.push('beneficiario_primer_apellido');
    if (!['M', 'F'].includes(fila.sexo?.trim().toUpperCase())) errores.push('sexo');
    if (!fila.genero?.trim()) errores.push('genero');
    if (!fila.etnia?.trim() || !['C', 'I', 'A', 'N', 'E', 'M'].includes(fila.etnia.trim().toUpperCase())) errores.push('etnia');
    if (!fila.victimaConflicto?.trim() || !['SI', 'NO'].includes(fila.victimaConflicto.trim().toUpperCase())) errores.push('victima_conflicto');
    if (!fila.esVivo?.trim() || !['SI', 'NO'].includes(fila.esVivo.trim().toUpperCase())) errores.push('es_vivo');
    if (!fila.discapacidad?.trim() || !['SI', 'NO'].includes(fila.discapacidad.trim().toUpperCase())) errores.push('discapacidad');
    if (!fila.tipoDocumento?.trim()) errores.push('tipo_documento');
    if (!['CC', 'TI', 'CE', 'NIT', 'PPT', 'RC'].includes(fila.tipoDocumento?.trim().toUpperCase())) errores.push('tipo_documento');
    if (!fila.numeroDocumento?.trim()) errores.push('numero_documento');
    if (fila.fechaNacimiento?.trim() && !this.fechaValida(fila.fechaNacimiento)) errores.push('fecha_nacimiento');
    if (fila.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fila.email.trim())) errores.push('email');
    return errores;
  }

  readonly filasFiltradas = computed(() => {
    const query = this.filtro().trim().toLocaleLowerCase();
    return this.filas()
      .map((fila, index) => ({ fila, index }))
      .filter(item => !query || [
        item.fila.actorRef,
        item.fila.nombreNucleo,
        item.fila.numeroDocumento,
        item.fila.beneficiarioPrimerNombre,
        item.fila.beneficiarioPrimerApellido,
      ].some(valor => valor?.toLocaleLowerCase().includes(query)));
  });

  readonly filasPagina = computed(() => {
    const inicio = this.pagina() * this.tamanoPagina;
    return this.filasFiltradas().slice(inicio, inicio + this.tamanoPagina);
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filasFiltradas().length / this.tamanoPagina)));

  constructor() {
    this.zonaService.getAll().subscribe({
      next: zonas => this.zonas.set(zonas),
      error: error => console.error('Error al obtener zonas', error),
    });

    this.route.queryParamMap.subscribe(params => {
      const importacionId = params.get('importacionId');
      if (importacionId) {
        this.cargando.set(true);
        this.service.obtener(importacionId).subscribe({
          next: response => {
            this.aplicarRespuesta(response.respuesta);
            this.cargando.set(false);
          },
          error: error => {
            this.cargando.set(false);
            this.alert.error('No se pudo recuperar la carga', this.mensajeError(error));
          },
        });
      }
    });
  }

  puedeConfirmar(): boolean {
    const resultado = this.resultado();
    return resultado?.estado === 'VALIDADA'
      && this.errores().length === 0
      && this.erroresLocales().length === 0
      && !this.editando()
      && !this.cargando();
  }

  puedeGuardarCorrecciones(): boolean {
    const resultado = this.resultado();
    return !!resultado
      && resultado.estado === 'VALIDADA'
      && this.editando()
      && this.erroresLocales().length === 0
      && !this.cargando();
  }

  motivoBloqueoConfirmacion(): string {
    const resultado = this.resultado();
    if (!resultado) return 'Carga un archivo para comenzar.';
    if (resultado.estado !== 'VALIDADA') return `La carga está en estado ${resultado.estado}.`;
    if (this.erroresLocales().length > 0) return 'Corrige los campos marcados en rojo.';
    if (this.errores().length > 0) return 'Guarda las correcciones para volver a validar.';
    if (this.editando()) return 'Guarda los cambios pendientes antes de confirmar.';
    if (this.cargando()) return 'Hay una operación en curso.';
    return 'Confirmar carga';
  }

  barriosDe(fila: ImportacionFila): IBarrio[] {
    if (!fila.idZona) return [];
    return this.barriosPorZona().get(fila.idZona) ?? [];
  }

  cambioZona(fila: ImportacionFila, valor: string): void {
    const idZona = valor ? Number(valor) : null;
    fila.idZona = idZona;
    fila.idBarrio = null;
    this.cambioCampo(fila, 'id_zona');
    this.cambioCampo(fila, 'id_barrio');

    if (idZona && !this.barriosPorZona().has(idZona)) {
      this.zonaService.getById(idZona).subscribe({
        next: zona => {
          this.barriosPorZona.update(mapa => new Map(mapa).set(idZona, zona.barrios ?? []));
        },
        error: error => console.error('Error al obtener barrios de la zona', error),
      });
    }
  }

  cambioCampo(fila: ImportacionFila, campo: string): void {
    if (campo === 'fecha_nacimiento') {
      fila.edadCalculada = this.calcularEdad(fila.fechaNacimiento);
    }
    this.editando.set(true);
    // fuerza la reactividad del signal para reflejar la mutación in-place de la fila
    this.filas.update(filas => [...filas]);
    const erroresRestantes = this.errores().filter(error =>
      !(error.numeroFila === fila.numeroFila && error.campo === campo)
    );
    if (erroresRestantes.length !== this.errores().length) {
      this.errores.set(erroresRestantes);
    }
  }

  private calcularEdad(fechaNacimiento: string | null | undefined): number | null {
    if (!fechaNacimiento || !this.fechaValida(fechaNacimiento)) return null;
    const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const cumplioEsteAnio = hoy.getMonth() > nacimiento.getMonth()
      || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
    if (!cumplioEsteAnio) edad--;
    return edad >= 0 ? edad : null;
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.alert.error('Archivo no valido', 'Selecciona un archivo Excel .xlsx.');
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
    if (this.erroresLocales().length > 0) {
      this.alert.warning('Corrige los datos antes de guardar', 'Hay filas vacías o campos con formato inválido.');
      return;
    }

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
        this.router.navigateByUrl('/nucleo');
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
      beneficiarioSegundoNombre: '',
      beneficiarioPrimerApellido: '',
      beneficiarioSegundoApellido: '',
      sexo: '',
      genero: '',
      etnia: '',
      edadCalculada: null,
      tipoDocumento: '',
      numeroDocumento: '',
      fechaNacimiento: '',
      victimaConflicto: 'NO',
      esVivo: 'SI',
      discapacidad: 'NO',
      telefono: '',
      email: '',
    }]);
    this.editando.set(true);
    this.pagina.set(Math.floor((this.filas().length - 1) / this.tamanoPagina));
  }

  eliminarFila(index: number): void {
    this.filas.update(filas => filas.filter((_, filaIndex) => filaIndex !== index));
    this.editando.set(true);
    this.pagina.set(Math.min(this.pagina(), this.totalPaginas() - 1));
  }

  cambiarFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.pagina.set(0);
  }

  paginaAnterior(): void {
    this.pagina.update(valor => Math.max(0, valor - 1));
  }

  paginaSiguiente(): void {
    this.pagina.update(valor => Math.min(this.totalPaginas() - 1, valor + 1));
  }

  errorDe(fila: ImportacionFila, campo: string): string | null {
    const error = this.errores().find(item =>
      item.numeroFila === fila.numeroFila && item.campo === campo
    );
    return error?.mensaje ?? null;
  }

  tieneError(fila: ImportacionFila, campo: string): boolean {
    return this.errorDe(fila, campo) !== null || this.camposInvalidos(fila).includes(campo);
  }

  descargarPlantilla(): void {
    if (this.descargandoPlantilla()) return;
    this.descargandoPlantilla.set(true);
    this.service.descargarPlantilla().subscribe({
      next: archivo => {
        const enlace = document.createElement('a');
        const url = URL.createObjectURL(archivo);
        enlace.href = url;
        enlace.download = 'plantilla-actores-sociales.xlsx';
        enlace.click();
        URL.revokeObjectURL(url);
        this.descargandoPlantilla.set(false);
      },
      error: error => {
        this.descargandoPlantilla.set(false);
        this.alert.error('No se pudo descargar la plantilla', this.mensajeError(error));
      },
    });
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

    const zonasPendientes = new Set(
      (resultado.filas ?? [])
        .map(fila => fila.idZona)
        .filter((idZona): idZona is number => !!idZona && !this.barriosPorZona().has(idZona))
    );
    zonasPendientes.forEach(idZona => {
      this.zonaService.getById(idZona).subscribe({
        next: zona => {
          this.barriosPorZona.update(mapa => new Map(mapa).set(idZona, zona.barrios ?? []));
        },
        error: error => console.error('Error al obtener barrios de la zona', error),
      });
    });
  }

  private mensajeError(error: any): string {
    return error?.error?.mensaje ?? error?.error?.message ?? 'Revisa la respuesta del servidor.';
  }

  private fechaValida(fecha: string | null | undefined): boolean {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const valor = new Date(`${fecha}T00:00:00`);
    return !Number.isNaN(valor.getTime()) && valor.toISOString().startsWith(fecha);
  }
}
