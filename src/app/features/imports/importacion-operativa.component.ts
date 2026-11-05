import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, finalize, forkJoin, Observable, of, Subject } from 'rxjs';
import { saveAs } from 'file-saver';
import {
  CatalogosImportacionOperativa, FilaImportacionOperativa, OpcionImportacionOperativa,
  ResultadoImportacionOperativa, TipoImportacionOperativa,
} from '../../core/models/importacion-operativa.model';
import { IResponsable } from '../../core/models/responsable.model';
import { AlertService } from '../../core/services/alert.service';
import { ImportacionOperativaService } from '../../core/services/importacion-operativa.service';
import { PageTitleService } from '../../core/services/pageTitle.service';
import { ResponsibleService } from '../../core/services/responsible.service';

type Campo = Exclude<keyof FilaImportacionOperativa, 'numeroFila' | 'hojaOrigen'>;
interface Columna { campo: Campo; titulo: string; }

@Component({
  selector: 'app-importacion-operativa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './importacion-operativa.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportacionOperativaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ImportacionOperativaService);
  private readonly responsibleService = inject(ResponsibleService);
  private readonly alert = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cambios = new Subject<void>();
  private revisionEdicion = 0;
  readonly prioridades = [
    { valor: 'A', texto: 'Alta' },
    { valor: 'M', texto: 'Media' },
    { valor: 'B', texto: 'Baja' },
  ];
  readonly tipo: TipoImportacionOperativa = this.route.snapshot.data['tipoImportacion'] === 'ACTAS' ? 'ACTAS' : 'ASOCIACIONES';
  readonly esActas = this.tipo === 'ACTAS';
  readonly titulo = this.esActas ? 'Carga masiva de actas' : 'Carga masiva de beneficiarios a proyectos';
  readonly volver = this.esActas ? '/proceedings' : '/projects/add-beneficiary/list';
  readonly rutaGestion = this.esActas
    ? '/proceedings/importacion-masiva/gestionar'
    : '/projects/add-beneficiary/importacion-masiva/gestionar';
  readonly ocupado = signal(false);
  readonly validando = signal(false);
  readonly preparado = signal(false);
  readonly errorCarga = signal('');
  readonly descargando = signal(false);
  readonly resultado = signal<ResultadoImportacionOperativa | null>(null);
  readonly filas = signal<FilaImportacionOperativa[]>([]);
  readonly responsables = signal<IResponsable[]>([]);
  readonly catalogos = signal<CatalogosImportacionOperativa>({ proyectos: [], categorias: [], productos: [] });
  readonly responsableId = signal<number | null>(null);
  readonly modificado = signal(false);
  readonly filtro = signal('');
  readonly soloErrores = signal(false);
  readonly pagina = signal(0);
  readonly tamanoPagina = 25;
  readonly editable = computed(() => this.resultado()?.estado === 'VALIDADA' && !this.ocupado());
  readonly puedeConfirmar = computed(() => this.preparado() && this.editable() && !this.validando() && !this.modificado()
    && this.resultado()?.errores.length === 0 && this.filas().length > 0);
  readonly resumenErrores = computed(() => {
    const documentosPorFila = new Map(this.filas().map(fila =>
      [fila.numeroFila, fila.numeroDocumento?.trim()] as const));
    const grupos = new Map<string, { campo: string; mensaje: string; total: number; filas: Set<number> }>();
    for (const error of this.resultado()?.errores ?? []) {
      const clave = JSON.stringify([error.campo, error.mensaje]);
      const grupo = grupos.get(clave);
      if (grupo) {
        grupo.total++;
        if (error.numeroFila > 0) grupo.filas.add(error.numeroFila);
      } else {
        grupos.set(clave, {
          campo: error.campo, mensaje: error.mensaje, total: 1,
          filas: new Set(error.numeroFila > 0 ? [error.numeroFila] : []),
        });
      }
    }
    return [...grupos.values()].map(grupo => ({
      ...grupo, filas: [...grupo.filas].sort((a, b) => a - b),
      documentos: [...new Set([...grupo.filas].map(fila => documentosPorFila.get(fila))
        .filter((documento): documento is string => !!documento))],
    }));
  });
  readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLocaleLowerCase();
    return this.filas().map((fila, index) => ({ fila, index })).filter(({ fila }) =>
      (!this.soloErrores() || this.erroresFila(fila.numeroFila).length > 0)
      && (!texto || Object.values(fila).some(valor => String(valor ?? '').toLocaleLowerCase().includes(texto))));
  });
  readonly paginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamanoPagina)));
  readonly filasPagina = computed(() => {
    const inicio = Math.min(this.pagina(), this.paginas() - 1) * this.tamanoPagina;
    return this.filtradas().slice(inicio, inicio + this.tamanoPagina);
  });
  readonly columnas: Columna[] = [
    ...(this.esActas ? [
      { campo: 'referenciaActa', titulo: 'Grupo acta' },
    ] satisfies Columna[] : []),
    { campo: 'numeroDocumento', titulo: 'Documento' },
    { campo: 'proyecto', titulo: 'Proyecto' },
    ...(this.esActas ? [
      { campo: 'categoria', titulo: 'Categoría' },
      { campo: 'producto', titulo: 'Producto' },
      { campo: 'cantidad', titulo: 'Cantidad' },
      { campo: 'fechaSolicitud', titulo: 'Fecha solicitud' },
      { campo: 'ubicacionEntrega', titulo: 'Ubicación entrega' },
      { campo: 'prioridad', titulo: 'Prioridad' },
      { campo: 'tipoSolicitud', titulo: 'Tipo solicitud' },
      { campo: 'responsableVisita', titulo: 'Responsable visita' },
    ] satisfies Columna[] : []),
    { campo: 'observaciones', titulo: 'Observaciones' },
  ];

  constructor() {
    inject(PageTitleService).setCurrentPage(this.titulo);
    this.cambios.pipe(debounceTime(1500), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.modificado()) this.validar();
    });
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (this.ocupado()) return;
    this.preparado.set(false);
    this.errorCarga.set('');
    const id = this.route.snapshot.queryParamMap.get('importacionId');
    this.ejecutar(forkJoin({
      catalogos: this.service.catalogos(),
      responsables: this.esActas ? this.responsibleService.getAll() : of<IResponsable[]>([]),
      carga: id ? this.service.obtener(this.tipo, id) : of(null),
    }), datos => {
      this.catalogos.set(datos.catalogos);
      this.responsables.set(datos.responsables.filter(r => r.estado === 'A' && r.estadoCuenta !== 'I'));
      if (datos.carga) this.aplicar(datos.carga.respuesta);
      this.preparado.set(true);
    });
  }

  descargarPlantilla(): void {
    if (this.descargando()) return;
    this.descargando.set(true);
    this.service.plantilla(this.tipo).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.descargando.set(false))
    ).subscribe({
      next: blob => saveAs(blob, this.esActas ? 'plantilla-actas.xlsx' : 'plantilla-beneficiarios-proyecto.xlsx'),
      error: error => this.mostrarError(error),
    });
  }

  async seleccionarArchivo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || this.ocupado() || !this.preparado()) return;
    if (!archivo.name.toLowerCase().endsWith('.xlsx') || archivo.size > 10 * 1024 * 1024) {
      this.alert.warning('Archivo no válido', 'Selecciona un Excel .xlsx de hasta 10 MB.');
      return;
    }
    if (!await this.puedeSalir()) return;
    this.ejecutar(this.service.simular(this.tipo, archivo, this.responsableId()), r => {
      this.aplicar(r.respuesta);
    });
  }

  cambiarResponsable(value: number | null): void {
    this.responsableId.set(value);
    if (this.resultado()?.estado === 'VALIDADA') this.marcarCambio();
  }

  cambiar(index: number, campo: Campo, valor: string): void {
    if (!this.editable()) return;
    this.filas.update(filas => filas.map((fila, i) => {
      if (i !== index) return fila;
      const nueva = { ...fila, [campo]: valor };
      if (campo === 'proyecto') { nueva.categoria = ''; nueva.producto = ''; }
      if (campo === 'categoria') nueva.producto = '';
      return nueva;
    }));
    this.marcarCambio();
  }

  quitar(index: number): void {
    if (!this.editable()) return;
    this.filas.update(filas => filas.filter((_, i) => i !== index));
    this.marcarCambio();
    this.pagina.set(0);
  }

  validar(): void {
    const resultado = this.resultado();
    if (!resultado || !this.editable() || this.validando() || !this.filas().length) return;
    const revision = this.revisionEdicion;
    let completada = false;
    this.validando.set(true);
    this.errorCarga.set('');
    const filas = this.esActas
      ? this.filas().map(fila => ({ ...fila, prioridad: this.valorPrioridad(fila.prioridad) }))
      : this.filas();
    this.service.actualizar(this.tipo, resultado, filas, this.responsableId()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.validando.set(false);
        if (completada && this.modificado()) this.cambios.next();
      }),
    ).subscribe({
      next: r => {
        // Conserva los controles y las ediciones realizadas mientras respondia el servidor.
        this.resultado.set(r.respuesta);
        if (revision === this.revisionEdicion) this.modificado.set(false);
        completada = true;
      },
      error: error => this.mostrarError(error),
    });
  }

  private marcarCambio(): void {
    this.revisionEdicion++;
    this.modificado.set(true);
    this.cambios.next();
  }

  async confirmar(): Promise<void> {
    const resultado = this.resultado();
    if (!resultado || !this.puedeConfirmar()) return;
    const confirmado = await this.alert.confirm('Confirmar carga',
      this.esActas
        ? `Se crearán ${resultado.totalOperaciones} actas en Recibido, sin descontar inventario. Si una falla, no se creará ninguna.`
        : `Se crearán ${resultado.totalOperaciones} asociaciones activas. Si una falla, no se guardará ninguna.`,
      'Confirmar', 'Cancelar');
    if (!confirmado || !this.puedeConfirmar()) return;
    this.ejecutar(this.service.confirmar(this.tipo, resultado), r => {
      this.aplicar(r.respuesta);
      if (r.respuesta.estado === 'CONFIRMADA') {
        this.alert.success('Carga confirmada', `${r.respuesta.idsCreados.length} registros creados.`);
      } else {
        this.alert.warning('La carga requiere correcciones', 'Los datos cambiaron o hay errores. Revisa la previsualización; no se creó ningún registro.');
      }
    });
  }

  erroresFila(numero: number) {
    return this.resultado()?.errores.filter(e => e.numeroFila === numero) ?? [];
  }

  actaCreada(fila: FilaImportacionOperativa): number | undefined {
    return this.resultado()?.actasPorGrupo?.[fila.referenciaActa.trim().toUpperCase()];
  }

  errorCampo(numero: number, campo: Campo): boolean {
    return this.erroresFila(numero).some(e => e.campo === campo);
  }

  opciones(campo: Campo, fila: FilaImportacionOperativa): OpcionImportacionOperativa[] {
    if (campo === 'proyecto') return this.catalogos().proyectos;
    if (campo === 'categoria') return this.catalogos().categorias.filter(c =>
      c.padreId === this.idOpcion(fila.proyecto, this.catalogos().proyectos));
    if (campo === 'producto') return this.catalogos().productos.filter(p =>
      p.padreId === this.idOpcion(fila.categoria, this.opciones('categoria', fila)));
    return [];
  }

  esCatalogo(campo: Campo): boolean {
    return campo === 'proyecto' || campo === 'categoria' || campo === 'producto';
  }

  valorPrioridad(valor: string): string {
    const limpio = valor?.trim().toLocaleUpperCase() ?? '';
    return this.prioridades.find(p => p.valor === limpio || p.texto.toLocaleUpperCase() === limpio)?.valor ?? limpio;
  }

  valorEnCatalogo(campo: Campo, fila: FilaImportacionOperativa): boolean {
    return this.opciones(campo, fila).some(opcion => this.etiquetaOpcion(opcion) === fila[campo]);
  }

  buscar(valor: string): void { this.filtro.set(valor); this.pagina.set(0); }
  filtrarErrores(valor: boolean): void { this.soloErrores.set(valor); this.pagina.set(0); }

  puedeSalir(): boolean | Promise<boolean> {
    if (this.ocupado() || this.validando()) return false;
    return !this.modificado() || this.alert.confirm('Cambios sin guardar',
      'Las correcciones no guardadas se perderán. La carga guardada seguirá disponible en pendientes.', 'Salir', 'Seguir editando');
  }

  @HostListener('window:beforeunload', ['$event'])
  antesDeSalir(evento: BeforeUnloadEvent): void {
    if (this.modificado() || this.ocupado() || this.validando()) { evento.preventDefault(); evento.returnValue = ''; }
  }

  private aplicar(resultado: ResultadoImportacionOperativa): void {
    this.resultado.set(resultado);
    this.filas.set(resultado.filas.map(f => ({ ...f })));
    this.responsableId.set(resultado.idResponsable);
    this.modificado.set(false);
    this.pagina.set(0);
  }

  private idOpcion(valor: string, opciones: OpcionImportacionOperativa[]): number | undefined {
    const nombre = valor?.replace(/ \(stock: \d+\)$/, '').trim().toLocaleLowerCase();
    const coincidencias = opciones.filter(opcion =>
      opcion.etiqueta === valor || this.nombreOpcion(opcion).toLocaleLowerCase() === nombre);
    if (coincidencias.length === 1) return coincidencias[0].id;
    return undefined;
  }

  nombreOpcion(opcion: OpcionImportacionOperativa): string {
    const nombre = opcion.etiqueta.slice(opcion.etiqueta.indexOf(' - ') + 3);
    if (opcion.stock === null) return nombre;
    const codigo = nombre.lastIndexOf(' [');
    return codigo >= 0 ? nombre.slice(0, codigo) : nombre.replace(/ \(stock: \d+\)$/, '');
  }

  etiquetaOpcion(opcion: OpcionImportacionOperativa): string {
    return this.nombreOpcion(opcion) + (opcion.stock === null ? '' : ` (stock: ${opcion.stock})`);
  }

  private ejecutar<T>(operacion: Observable<T>, siguiente: (valor: T) => void): void {
    if (this.ocupado() || this.validando()) return;
    this.ocupado.set(true);
    this.errorCarga.set('');
    operacion.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.ocupado.set(false))).subscribe({
      next: siguiente,
      error: error => this.mostrarError(error),
    });
  }

  private async mostrarError(error: unknown): Promise<void> {
    console.error('Error en carga operativa:', error);
    let mensaje = 'No se pudo completar la operación. Reintenta o vuelve a consultar la carga antes de confirmar.';
    if (error instanceof HttpErrorResponse) {
      let detalle: unknown = error.error;
      if (detalle instanceof Blob) detalle = await detalle.text();
      if (typeof detalle === 'string' && detalle.trim()) mensaje = detalle;
      if (typeof detalle === 'object' && detalle !== null && 'mensaje' in detalle && typeof detalle.mensaje === 'string') {
        mensaje = detalle.mensaje;
      }
    }
    this.errorCarga.set(mensaje);
    this.alert.error('No se pudo completar la carga', mensaje);
  }
}
