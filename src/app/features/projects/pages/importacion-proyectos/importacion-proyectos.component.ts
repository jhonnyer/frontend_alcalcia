import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AlertService } from '../../../../core/services/alert.service';
import { ImportacionProyectosService } from '../../../../core/services/importacion-proyectos.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { mensajeErrorReporteExcel } from '../../../../shared/components/excel/excel-error.utils';
import {
  ImportacionProyectoFila,
  ImportacionProyectosResultado,
  ContextoImportacionInventario,
  ImportacionProyectosFilasRequest,
  TipoCargaProyecto,
} from '../../../../core/models/importacion-proyectos.model';

type CampoEditable =
  | 'proyecto' | 'descripcionProyecto' | 'tipoProyecto' | 'fechaInicio' | 'fechaFin' | 'contrato'
  | 'categoria' | 'descripcionCategoria' | 'producto' | 'descripcionProducto' | 'stock' | 'cantidadAgregar';

// Nombres de campo que devuelve el backend en los errores.
const CAMPO_ERROR: Record<CampoEditable, string> = {
  proyecto: 'proyecto',
  descripcionProyecto: 'descripcion_proyecto',
  tipoProyecto: 'tipo_proyecto',
  fechaInicio: 'fecha_inicio',
  fechaFin: 'fecha_fin',
  contrato: 'contrato',
  categoria: 'categoria',
  descripcionCategoria: 'descripcion_categoria',
  producto: 'producto',
  descripcionProducto: 'descripcion_producto',
  stock: 'stock',
  cantidadAgregar: 'cantidad_agregar',
};

@Component({
  selector: 'app-importacion-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./importacion-proyectos.component.css'],
  templateUrl: './importacion-proyectos.component.html',
})
export class ImportacionProyectosComponent implements OnInit {
  private readonly service = inject(ImportacionProyectosService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly proyectosService = inject(ProyectosService);
  readonly contexto: ContextoImportacionInventario | undefined = this.route.snapshot.paramMap.has('id')
    ? { idProyecto: Number(this.route.snapshot.paramMap.get('id')), actualizar: this.route.snapshot.data['actualizarInventario'] === true }
    : undefined;
  readonly actualizar = this.contexto?.actualizar ?? false;
  readonly tipoOperacion: TipoCargaProyecto = this.contexto
    ? (this.actualizar ? 'ACTUALIZAR_INVENTARIO' : 'CREAR_INVENTARIO') : 'PROYECTOS';
  readonly rutaVolver = this.contexto ? ['/projects/update', this.contexto.idProyecto] : ['/projects'];
  readonly titulo = this.contexto
    ? (this.actualizar ? 'Actualizar datos y agregar stock' : 'Cargar categorías y productos')
    : 'Carga masiva de proyectos';
  readonly nombreProyecto = signal('');
  readonly cargandoProyecto = signal(!!this.contexto);
  readonly errorProyecto = signal('');
  readonly errorBorrador = signal('');
  readonly idBorrador = signal<number | null>(null);
  readonly versionBorrador = signal<number | null>(null);
  readonly cambiosSinGuardar = signal(false);

  readonly resultado = signal<ImportacionProyectosResultado | null>(null);
  readonly filas = signal<ImportacionProyectoFila[]>([]);
  readonly errores = signal<ImportacionProyectosResultado['errores']>([]);
  readonly archivoNombre = signal('');
  readonly cargando = signal(false);
  readonly descargandoPlantilla = signal(false);
  readonly cambiosPendientes = signal(false);
  readonly filtro = signal('');
  readonly pestana = signal<'filas' | 'errores'>('filas');
  readonly paginaActual = signal(0);
  readonly tamanoPagina = signal(10);
  readonly opcionesPagina = [5, 10, 25, 50, 100];

  readonly erroresPorFila = computed(() => {
    const indice = new Map<number, ImportacionProyectosResultado['errores']>();
    for (const error of this.errores()) {
      if (error.numeroFila == null) continue;
      const lista = indice.get(error.numeroFila) ?? [];
      lista.push(error);
      indice.set(error.numeroFila, lista);
    }
    return indice;
  });
  readonly filasConErrores = computed(() =>
    this.filas().filter(f => f.numeroFila != null && this.erroresPorFila().has(f.numeroFila)));
  readonly erroresGenerales = computed(() => {
    const numeros = new Set(this.filas().map(f => f.numeroFila).filter(n => n != null));
    return this.errores().filter(e => e.numeroFila == null || !numeros.has(e.numeroFila));
  });
  readonly filtradas = computed(() => {
    const q = this.filtro().trim().toLocaleLowerCase();
    const filas = this.pestana() === 'errores' ? this.filasConErrores() : this.filas();
    return filas.filter(f => !q ||
      [f.proyecto, f.categoria, f.producto].some(v => v?.toLocaleLowerCase().includes(q)));
  });
  readonly pagina = computed(() =>
    this.filtradas().slice(this.paginaActual() * this.tamanoPagina(), (this.paginaActual() + 1) * this.tamanoPagina()));
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamanoPagina())));

  readonly puedeConfirmar = computed(() =>
    !!this.resultado() && !this.resultado()?.confirmada
    && this.filas().length > 0 && !this.cargando() && !this.cargandoProyecto() && !this.errorProyecto() && !this.errorBorrador());

  ngOnInit(): void {
    if (this.contexto) this.cargarProyecto();
    if (this.route.snapshot.queryParamMap.has('borrador')) this.cargarBorrador();
  }

  async cargarBorrador(): Promise<void> {
    const id = Number(this.route.snapshot.queryParamMap.get('borrador'));
    this.errorBorrador.set('');
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorBorrador.set('El identificador del borrador no es válido.');
      return;
    }
    this.cargando.set(true);
    try {
      const { respuesta } = await firstValueFrom(this.service.obtenerBorrador(id));
      if (respuesta.tipoOperacion !== this.tipoOperacion || respuesta.idProyecto !== (this.contexto?.idProyecto ?? null)) {
        this.errorBorrador.set('El borrador pertenece a otra operación o proyecto. Ábrelo desde Gestionar cargas.');
        return;
      }
      this.idBorrador.set(respuesta.idImportacion);
      this.versionBorrador.set(respuesta.versionDatos);
      this.archivoNombre.set(respuesta.nombreArchivo);
      this.aplicar(respuesta.resultado);
      this.cambiosSinGuardar.set(false);
    } catch (error) {
      this.errorBorrador.set(this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  cargarProyecto(): void {
    if (!this.contexto) return;
    this.errorProyecto.set('');
    if (!Number.isSafeInteger(this.contexto.idProyecto) || this.contexto.idProyecto <= 0) {
      this.cargandoProyecto.set(false);
      this.errorProyecto.set('El identificador del proyecto no es válido.');
      return;
    }
    this.cargandoProyecto.set(true);
    this.proyectosService.getById(String(this.contexto.idProyecto)).subscribe({
      next: ({ respuesta }) => {
        this.nombreProyecto.set(respuesta.proyecto.nombre);
        this.cargandoProyecto.set(false);
      },
      error: error => {
        this.cargandoProyecto.set(false);
        this.errorProyecto.set(this.mensajeError(error));
      }
    });
  }

  // Cierre o recarga de la pestaña con cambios sin guardar.
  @HostListener('window:beforeunload', ['$event'])
  avisarAlCerrar(event: BeforeUnloadEvent): void {
    if (this.cargando() || this.cambiosSinGuardar()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // Navegación interna (lo usa el guard de la ruta).
  puedeSalir(): boolean | Promise<boolean> {
    if (this.cargando()) return false;
    if (!this.cambiosSinGuardar()) return true;
    return this.alert.confirm(
      'Carga pendiente',
      'Hay cambios sin guardar en el borrador. Si sales, se perderán esos cambios.',
      'Salir',
      'Quedarme'
    );
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || this.cargando() || this.cargandoProyecto() || this.errorProyecto()) return;
    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.alert.error('Archivo no válido', 'Selecciona un archivo Excel .xlsx.');
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      this.alert.error('Archivo demasiado grande', 'El tamaño máximo es de 10 MB.');
      return;
    }
    this.cargando.set(true);
    this.service.simular(archivo, this.contexto).subscribe({
      next: res => {
        this.archivoNombre.set(archivo.name);
        this.aplicar(res.respuesta);
        this.cambiosSinGuardar.set(true);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudo validar el archivo', this.mensajeError(error));
      },
    });
  }

  validar(): void {
    if (this.cargando()) return;
    if (!this.filas().length) {
      this.alert.warning('Sin filas', 'Agrega al menos una fila para validar.');
      return;
    }
    this.cargando.set(true);
    this.service.simularFilas(this.solicitud(), this.contexto).subscribe({
      next: res => {
        this.aplicar(res.respuesta);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.alert.error('No se pudieron validar los cambios', this.mensajeError(error));
      },
    });
  }

  async guardarBorrador(): Promise<void> {
    if (this.cargando()) return;
    this.cargando.set(true);
    try {
      await this.persistirBorrador();
      this.alert.success('Borrador guardado', 'Puedes retomarlo desde Gestionar cargas. No se han aplicado cambios al inventario.');
    } catch (error) {
      this.alert.error('No se pudo guardar el borrador', this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  private async persistirBorrador(): Promise<{ id: number; version: number }> {
    const { respuesta } = await firstValueFrom(this.service.guardarBorrador({
      ...this.solicitud(), versionDatos: this.versionBorrador(), tipoOperacion: this.tipoOperacion,
      ...(this.contexto ? { idProyecto: this.contexto.idProyecto } : {})
    }, this.idBorrador()));
    this.idBorrador.set(respuesta.idImportacion);
    this.versionBorrador.set(respuesta.versionDatos);
    this.resultado.set({ ...respuesta.resultado, errores: this.errores() });
    this.filas.set(respuesta.resultado.filas.map(f => ({ ...f, tipoProyecto: this.normalizarTipo(f.tipoProyecto) })));
    this.cambiosSinGuardar.set(false);
    void this.router.navigate([], {
      relativeTo: this.route, queryParams: { borrador: respuesta.idImportacion },
      queryParamsHandling: 'merge', replaceUrl: true
    });
    return { id: respuesta.idImportacion, version: respuesta.versionDatos };
  }

  async confirmar(): Promise<void> {
    if (!this.puedeConfirmar()) return;
    this.cargando.set(true);
    try {
      const validacion = await firstValueFrom(this.service.simularFilas(this.solicitud(), this.contexto));
      this.aplicar(validacion.respuesta);
      if (this.errores().length) {
        this.alert.warning('Carga con errores', `Corrige los ${this.errores().length} errores indicados antes de confirmar. Puedes guardar el borrador mientras los corriges.`);
        return;
      }
      const r = validacion.respuesta;
      const productos = new Map<number, number>();
      if (this.actualizar) {
        this.filas().forEach(f => {
          if (f.idProducto) productos.set(f.idProducto, Number(f.cantidadAgregar ?? 0));
        });
      }
      const unidades = [...productos.values()].reduce((total, cantidad) => total + cantidad, 0);
      const detalle = this.actualizar
        ? `Se actualizarán los datos de ${r.totalCategorias} categorías y ${r.totalProductos} productos. Se agregarán ${unidades} unidades de stock en total. No se resta stock ni se eliminan registros.`
        : `${this.contexto ? '' : r.totalProyectos + ' proyectos, '}${r.totalCategorias} categorías y ${r.totalProductos} productos en la carga. No se modificará nada hasta confirmar.`;
      if (!await this.alert.confirm('Confirmar carga validada', detalle + ' Una vez confirmada no podrás editar esta carga.', 'Confirmar carga', 'Seguir revisando')) return;
      const borrador = await this.persistirBorrador();
      const res = await firstValueFrom(this.service.confirmarBorrador(borrador.id, borrador.version));
      this.resultado.set(res.respuesta);
      this.cambiosPendientes.set(false);
      this.cambiosSinGuardar.set(false);
      this.alert.success('Carga confirmada', this.actualizar
        ? `Datos actualizados y ${unidades} unidades agregadas al stock.`
        : 'La carga se aplicó correctamente.');
      this.cargando.set(false);
      void this.router.navigate(this.rutaVolver);
    } catch (error) {
      this.cambiosPendientes.set(true);
      this.alert.error('No se pudo confirmar la carga', this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  editar(fila: ImportacionProyectoFila, campo: CampoEditable, event: Event): void {
    const valor = (event.target as HTMLInputElement | HTMLSelectElement).value;
    fila[campo] = valor === '' ? null : valor;
    if (this.actualizar && (campo === 'categoria' || campo === 'descripcionCategoria')) {
      this.filas().filter(f => f.idCategoria === fila.idCategoria).forEach(f => f[campo] = valor === '' ? null : valor);
      this.filas.update(filas => [...filas]);
    }
    if (this.actualizar && fila.idProducto && (campo === 'producto' || campo === 'descripcionProducto' || campo === 'cantidadAgregar')) {
      this.filas().filter(f => f.idProducto === fila.idProducto).forEach(f => f[campo] = valor === '' ? null : valor);
      this.filas.update(filas => [...filas]);
    }
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  eliminar(fila: ImportacionProyectoFila): void {
    this.filas.update(lista => lista.filter(f => f !== fila));
    this.paginaActual.update(p => Math.min(p, this.totalPaginas() - 1));
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  agregarFila(): void {
    const nueva: ImportacionProyectoFila = {
      numeroFila: null, proyecto: this.contexto ? this.nombreProyecto() : null, descripcionProyecto: null, tipoProyecto: null, fechaInicio: null,
      fechaFin: null, contrato: null, categoria: null, producto: null, descripcionProducto: null, stock: null,
    };
    this.cambiarPestana(0);
    this.filtro.set('');
    this.filas.update(lista => [...lista, nueva]);
    this.paginaActual.set(this.totalPaginas() - 1);
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  unificarProyecto(): void {
    const nombre = this.filas().find(f => f.proyecto?.trim())?.proyecto;
    if (!nombre) return;
    this.filas().forEach(f => (f.proyecto = nombre));
    this.filas.update(lista => [...lista]);
    this.cambiosPendientes.set(true);
    this.cambiosSinGuardar.set(true);
  }

  tieneError(fila: ImportacionProyectoFila, campo: CampoEditable): boolean {
    return this.erroresFila(fila).some(e => e.campo === CAMPO_ERROR[campo]);
  }

  erroresFila(fila: ImportacionProyectoFila): ImportacionProyectosResultado['errores'] {
    return fila.numeroFila == null ? [] : this.erroresPorFila().get(fila.numeroFila) ?? [];
  }

  cambiarPestana(indice: number): void {
    const pestana = indice === 1 ? 'errores' : 'filas';
    if (this.pestana() === pestana) return;
    this.pestana.set(pestana);
    this.filtro.set('');
    this.paginaActual.set(0);
  }

  cambiarFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.paginaActual.set(0);
  }

  anterior(): void { this.paginaActual.update(v => Math.max(0, v - 1)); }
  siguiente(): void { this.paginaActual.update(v => Math.min(this.totalPaginas() - 1, v + 1)); }

  cambiarTamano(event: Event): void {
    this.tamanoPagina.set(Number((event.target as HTMLSelectElement).value));
    this.paginaActual.set(0);
  }

  descargarPlantilla(): void {
    if (this.descargandoPlantilla() || this.cargando() || this.cargandoProyecto() || this.errorProyecto()) return;
    this.descargandoPlantilla.set(true);
    this.service.descargarPlantilla(this.contexto).subscribe({
      next: blob => {
        const enlace = document.createElement('a');
        const url = URL.createObjectURL(blob);
        enlace.href = url;
        enlace.download = this.contexto
          ? `proyecto-${this.contexto.idProyecto}-${this.actualizar ? 'actualizar-datos' : 'nuevos-productos'}.xlsx`
          : 'plantilla-proyectos.xlsx';
        enlace.click();
        URL.revokeObjectURL(url);
        this.descargandoPlantilla.set(false);
      },
      error: async error => {
        this.descargandoPlantilla.set(false);
        this.alert.error('No se pudo descargar la plantilla', await mensajeErrorReporteExcel(error));
      },
    });
  }

  async reiniciar(): Promise<void> {
    if (!await this.puedeSalir()) return;
    this.resultado.set(null);
    this.filas.set([]);
    this.errores.set([]);
    this.archivoNombre.set('');
    this.cambiosPendientes.set(false);
    this.filtro.set('');
    this.pestana.set('filas');
    this.paginaActual.set(0);
    this.idBorrador.set(null);
    this.versionBorrador.set(null);
    this.cambiosSinGuardar.set(false);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { borrador: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private aplicar(resultado: ImportacionProyectosResultado): void {
    this.resultado.set(resultado);
    this.filas.set((resultado.filas ?? []).map(f => ({ ...f, tipoProyecto: this.normalizarTipo(f.tipoProyecto) })));
    this.errores.set(resultado.errores ?? []);
    if (this.errores().length) this.cambiarPestana(1);
    this.cambiosPendientes.set(false);
    this.paginaActual.set(0);
  }

  private normalizarTipo(tipo: string | null): string | null {
    const t = (tipo ?? '').trim().toLowerCase();
    if (t === 'm' || t === 'municipal') return 'Municipal';
    if (t === 'd' || t === 'departamental') return 'Departamental';
    return tipo;
  }

  private solicitud(): ImportacionProyectosFilasRequest {
    return { nombreArchivo: this.archivoNombre(), filas: this.filas() };
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (typeof body === 'string' && body.trim()) return body;
      if (body && typeof body === 'object') {
        if ('mensaje' in body && typeof body.mensaje === 'string') return body.mensaje;
        if ('message' in body && typeof body.message === 'string') return body.message;
      }
    }
    return 'No se pudo completar la operación. Revisa la conexión y la respuesta del servidor.';
  }
}
