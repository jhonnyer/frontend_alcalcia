import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { finalize, forkJoin, of, timeout } from 'rxjs';
import { FiltroReportePdf, OpcionesFiltroPdf } from '../../../core/models/reporte-pdf.model';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { ResponsibleService } from '../../../core/services/responsible.service';
import { ReportSearchOption, ReportSearchSelectComponent } from '../report-search-select/report-search-select.component';
import { pdfErrorMessage } from './pdf-export.utils';

@Component({
  selector: 'app-pdf-filtros-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, ReportSearchSelectComponent],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p class="intro">Configura aquí todas las opciones del PDF. No necesitas completar otro formulario. Deja una opción sin seleccionar para incluir todos sus registros.</p>
      <div class="scope">
        <strong>Datos actuales:</strong> personas vivas y activas en la secretaría. Las asignaciones se muestran solo si siguen activas y pertenecen a proyectos activos.
        @if (!data.vinculaciones) {
          <br><strong>Antecedentes:</strong> se conservan las actas y entregas aunque el proyecto o la persona ya no estén activos.
        } @else {
          <br>Este listado parte de la página visible; no exporta todas las páginas.
        }
      </div>
      @if (loading) { <p role="status">Cargando opciones de filtros…</p> }
      @if (loadError) {
        <div class="error" role="alert">{{ loadError }} <button mat-button type="button" (click)="cargarOpciones()">Reintentar</button></div>
      }
      <div class="filters">
        <div class="group-heading">
          <h3>1. ¿Qué período quieres consultar?</h3>
          <p>En proyectos y asignaciones se consideran sus fechas de inicio y finalización. Las cifras de población siguen mostrando quién está activo actualmente.</p>
        </div>
        <label>Período del informe
          <select class="input-base" [(ngModel)]="periodo">
            <option value="ALL">Sin límite de fechas</option>
            <option value="YEAR">Un año completo</option>
            <option value="MONTH">Un mes de un año</option>
            <option value="RANGE">Entre dos fechas</option>
          </select>
        </label>
        @if (periodo === 'YEAR' || periodo === 'MONTH') {
          <label>Año <input class="input-base" type="number" min="1900" max="9999" step="1" [(ngModel)]="anio"></label>
        }
        @if (periodo === 'MONTH') {
          <label>Mes
            <select class="input-base" [(ngModel)]="mes">
              @for (nombre of meses; track $index) { <option [ngValue]="$index + 1">{{ nombre }}</option> }
            </select>
          </label>
        }
        @if (periodo === 'RANGE') {
          <label>Fecha inicial (incluida) <input class="input-base" type="date" [max]="hasta || '9999-12-31'" [(ngModel)]="desde"></label>
          <label>Fecha final (incluida) <input class="input-base" type="date" [min]="desde" max="9999-12-31" [(ngModel)]="hasta"></label>
        }
        @if (!data.vinculaciones) {
          <label>¿Qué fecha se revisa en las actas?
            <select class="input-base" aria-describedby="pdf-fecha-ayuda" [(ngModel)]="fechaActa">
              <option value="CREACION">Fecha de creación · solicitudes registradas</option>
              <option value="ENTREGA">Fecha de entrega · entregas registradas</option>
            </select>
            <small id="pdf-fecha-ayuda">
              @if (fechaActa === 'ENTREGA') {
                Para revisar entregas de un mes o año, usa esta fecha y marca «Entregado» en el estado del acta.
                @if (periodo !== 'ALL') { No se incluirán actas sin fecha de entrega. }
              } @else {
                Consulta las actas creadas en el período. Sus entregas pueden haber ocurrido después.
              }
            </small>
          </label>
        }
        <div class="group-heading">
          <h3>2. ¿Qué proyecto o ayudas quieres revisar?</h3>
          <p>Estas opciones se aplican al conjunto del informe. Puedes incluir todos los proyectos o concentrarte en uno.</p>
        </div>
        <div class="field"><span>Proyecto</span>
          <app-report-search-select label="Proyecto del PDF" placeholder="Buscar proyecto · todos"
            [options]="proyectos" [value]="idTexto(idProyecto)" [disabled]="data.proyectoFijo !== undefined || loading"
            [resetKey]="resetKey" (valueChange)="cambiarProyecto($event)" (searchValidChange)="proyectoValido = $event" />
          <small>
            @if (data.proyectoFijo !== undefined) { Este informe corresponde al proyecto abierto; no se puede cambiar aquí. }
            @else if (data.vinculaciones) { El listado solo incluye asignaciones actuales a proyectos activos. }
            @else { Incluye proyectos inactivos para poder consultar sus actas y entregas anteriores. }
          </small>
        </div>
        <div class="field"><span>Categoría del proyecto</span>
          <app-report-search-select label="Categoría del PDF"
            [placeholder]="idProyecto === null ? 'Selecciona primero un proyecto' : 'Buscar categoría · todas'"
            [options]="categoriasProyecto" [value]="idTexto(idCategoria)" [disabled]="idProyecto === null || loading"
            [resetKey]="categoriaResetKey" (valueChange)="idCategoria = numeroId($event)" (searchValidChange)="categoriaValida = $event" />
          <small>Primero elige un proyecto. Deja la categoría vacía para incluir todas sus ayudas.</small>
        </div>
        @if (!data.vinculaciones) {
          <div class="group-heading">
            <h3>3. ¿Qué actas quieres incluir?</h3>
            <p>Estas opciones solo cambian las actas y las entregas. No reducen los listados ni las cifras de población o asignaciones actuales.</p>
          </div>
          <label>Buscar por tipo de solicitud
            <input class="input-base" type="search" aria-describedby="pdf-solicitud-ayuda" maxlength="200" [(ngModel)]="tipoSolicitud" placeholder="Escribe todo o parte del tipo de solicitud">
            <small id="pdf-solicitud-ayuda">Busca por el tipo registrado, no por el nombre del beneficiario. Déjalo vacío para consultar todos.</small>
          </label>
          <div class="field"><span>Responsable de actas</span>
            <app-report-search-select label="Responsable del PDF" placeholder="Buscar responsable · todos"
              [options]="responsables" [value]="idTexto(idResponsable)" [disabled]="loading"
              [resetKey]="resetKey" (valueChange)="idResponsable = numeroId($event)" (searchValidChange)="responsableValido = $event" />
            <small>Consulta las actas asignadas a una persona. Vacío incluye todos los responsables y las actas sin responsable.</small>
          </div>
          <fieldset>
            <legend>Estado actual del acta</legend>
            <p class="field-help">Sin marcar: todos los estados. Marca «Entregado» si solo necesitas actas que figuran como entregadas.</p>
            @for (opcion of estados; track opcion.value) {
              <label class="check"><input type="checkbox" [checked]="estadosSeleccionados.includes(opcion.value)" (change)="alternar(estadosSeleccionados, opcion.value)">{{ opcion.label }}</label>
            }
          </fieldset>
          <fieldset>
            <legend>Prioridad de la solicitud</legend>
            <p class="field-help">Puedes marcar varias prioridades. Sin marcar: se incluyen todas.</p>
            @for (opcion of prioridades; track opcion.value) {
              <label class="check"><input type="checkbox" [checked]="prioridadesSeleccionadas.includes(opcion.value)" (change)="alternar(prioridadesSeleccionadas, opcion.value)">{{ opcion.label }}</label>
            }
          </fieldset>
        }
        @if (data.actor) {
          <div class="group-heading">
            <h3>4. ¿Qué edades quieres revisar?</h3>
            <p>Solo cambia la población actual y sus distribuciones. Las actas y las asignaciones se mantienen aunque correspondan a otras edades.</p>
          </div>
          <label>Edad de la población actual
            <select class="input-base" [(ngModel)]="rangoEdad">
              @for (rango of edades; track rango) { <option [value]="rango">{{ rango === 'TODOS' ? 'Todas las edades' : rango }}</option> }
            </select>
          </label>
        }
      </div>
      <div class="summary" aria-live="polite"><strong>Período elegido:</strong> {{ resumenPeriodo }}.
        @if (!data.vinculaciones) { <span> Fecha de actas: {{ fechaActa === 'ENTREGA' ? 'entrega registrada' : 'creación del acta' }}.</span> }
        <p>Los filtros se aplican juntos. Revisa las opciones antes de descargar.</p>
      </div>
      @if (validationError) { <p class="error" role="alert">{{ validationError }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="limpiar()">Limpiar filtros</button>
      <button mat-button type="button" (click)="dialog.close()">Cancelar</button>
      <button mat-flat-button color="primary" type="button" [disabled]="loading || !!loadError" (click)="confirmar()">Descargar PDF</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; color: #334155; }
    .intro { font-size: .85rem; line-height: 1.5; margin: 0 0 1rem; }
    .scope { border: 1px solid #bfdbfe; background: #eff6ff; border-radius: .5rem; padding: .75rem; font-size: .85rem; margin-bottom: 1rem; }
    .filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem; }
    .group-heading { grid-column: 1 / -1; border-top: 1px solid #dbe5f0; padding-top: 1rem; margin-top: .25rem; }
    .group-heading h3 { font-size: .95rem; font-weight: 600; color: #1e3a8a; margin: 0 0 .35rem; }
    .group-heading p, small, .field-help { font-size: .78rem; line-height: 1.5; color: #64748b; margin: 0; }
    label, .field { display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; min-width: 0; }
    .input-base { width: 100%; min-height: 36px; border: 1px solid #cbd5e1; border-radius: .4rem; padding: .4rem .6rem; background: white; }
    fieldset { border: 1px solid #e2e8f0; border-radius: .4rem; padding: .6rem; min-width: 0; }
    legend { font-size: .8rem; padding: 0 .25rem; }
    .check { display: inline-flex; flex-direction: row; align-items: center; margin: .35rem .5rem 0 0; padding: .3rem .45rem; border: 1px solid #cbd5e1; border-radius: .35rem; cursor: pointer; }
    .check:has(input:checked) { background: #eff6ff; border-color: #2563eb; }
    .summary { border-left: 3px solid #2563eb; background: #f8fafc; padding: .75rem; margin-top: 1rem; font-size: .8rem; line-height: 1.5; }
    .summary p { margin: .25rem 0 0; }
    .error { color: #991b1b; font-size: .85rem; }
    @media (max-width: 600px) { .filters { grid-template-columns: minmax(0, 1fr); } }
  `]
})
export class PdfFiltrosDialogComponent implements OnInit {
  readonly data = inject<OpcionesFiltroPdf>(MAT_DIALOG_DATA);
  readonly dialog = inject<MatDialogRef<PdfFiltrosDialogComponent, FiltroReportePdf>>(MatDialogRef);
  private readonly proyectosService = inject(ProyectosService);
  private readonly responsablesService = inject(ResponsibleService);
  private readonly destroyRef = inject(DestroyRef);
  periodo: 'ALL' | 'YEAR' | 'MONTH' | 'RANGE' = this.data.filtro.fechaInicio ? 'RANGE' : 'ALL';
  anio = this.data.filtro.fechaInicio ? Number(this.data.filtro.fechaInicio.slice(0, 4)) : new Date().getFullYear();
  mes = this.data.filtro.fechaInicio ? Number(this.data.filtro.fechaInicio.slice(5, 7)) : new Date().getMonth() + 1;
  desde = this.data.filtro.fechaInicio ?? '';
  hasta = this.data.filtro.fechaFin ?? '';
  fechaActa = this.data.filtro.fechaActa ?? 'CREACION';
  idProyecto = this.data.proyectoFijo ?? this.data.filtro.idProyecto ?? null;
  idCategoria = this.data.filtro.idCategoria ?? null;
  idResponsable = this.data.filtro.idResponsable ?? null;
  tipoSolicitud = this.data.filtro.tipoSolicitud ?? '';
  rangoEdad = this.data.filtro.rangoEdad ?? 'TODOS';
  estadosSeleccionados = [...(this.data.filtro.estadoActa ?? [])];
  prioridadesSeleccionadas = [...(this.data.filtro.prioridades ?? [])];
  proyectos: ReportSearchOption[] = [];
  responsables: ReportSearchOption[] = [];
  categorias: Array<ReportSearchOption & { idProyecto: number }> = [];
  loading = false;
  loadError = '';
  validationError = '';
  proyectoValido = true;
  categoriaValida = true;
  responsableValido = true;
  resetKey = 0;
  categoriaResetKey = 0;
  readonly meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly edades = ['TODOS', '0-12', '13-17', '18-29', '30-59', '60+'];
  readonly estados = [
    { value: 'R', label: 'Recibido' }, { value: 'P', label: 'Pendiente' }, { value: 'A', label: 'Autorizado' },
    { value: 'E', label: 'Entregado' }, { value: 'RC', label: 'Rechazado' }
  ];
  readonly prioridades = [{ value: 'A', label: 'Alta' }, { value: 'M', label: 'Media' }, { value: 'B', label: 'Baja' }];

  ngOnInit(): void {
    if (this.data.filtro.alcance === 'YEAR' && this.desde) this.periodo = 'YEAR';
    if (this.data.filtro.alcance === 'MONTH' && this.desde) this.periodo = 'MONTH';
    this.cargarOpciones();
  }

  cargarOpciones(): void {
    if (this.loading) return;
    this.loading = true;
    this.loadError = '';
    forkJoin({
      proyectos: this.proyectosService.getAll(),
      responsables: this.data.vinculaciones ? of([]) : this.responsablesService.getAll()
    }).pipe(timeout(45000), takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false)).subscribe({
      next: ({ proyectos, responsables }) => {
        this.proyectos = proyectos.respuesta.map(p => ({ value: String(p.proyecto.idProyecto), label: `${p.proyecto.nombre}${p.proyecto.estado === 'I' ? ' · Inactivo (histórico)' : ''}` }));
        this.categorias = proyectos.respuesta.flatMap(p => p.categorias.map(c => ({ value: String(c.idCategoria), label: c.nombre, idProyecto: p.proyecto.idProyecto })));
        this.responsables = responsables.map(r => ({ value: String(r.idResponsable), label: `${r.primerNombre} ${r.primerApellido}${r.estado === 'I' ? ' · Inactivo (histórico)' : ''}` }));
      },
      error: error => {
        console.error('Error al cargar filtros PDF:', error);
        this.loadError = pdfErrorMessage(error);
      }
    });
  }

  get categoriasProyecto(): ReportSearchOption[] { return this.categorias.filter(c => c.idProyecto === this.idProyecto); }
  get resumenPeriodo(): string {
    if (this.periodo === 'YEAR') return `año ${this.anio || 'sin indicar'}`;
    if (this.periodo === 'MONTH') return `${this.meses[this.mes - 1] ?? 'Mes sin indicar'} de ${this.anio || 'año sin indicar'}`;
    if (this.periodo === 'RANGE') return `${this.desde || 'fecha inicial pendiente'} a ${this.hasta || 'fecha final pendiente'}`;
    return 'sin límite de fechas';
  }
  idTexto(id: number | null): string | null { return id === null ? null : String(id); }
  numeroId(value: string | null): number | null { return value === null ? null : Number(value); }
  cambiarProyecto(value: string | null): void {
    const id = this.numeroId(value);
    if (id !== this.idProyecto) {
      this.idCategoria = null;
      this.categoriaValida = true;
      this.categoriaResetKey++;
    }
    this.idProyecto = id;
  }
  alternar(lista: string[], value: string): void {
    const index = lista.indexOf(value);
    if (index < 0) lista.push(value);
    else lista.splice(index, 1);
  }
  limpiar(): void {
    this.periodo = 'ALL';
    this.anio = new Date().getFullYear();
    this.mes = new Date().getMonth() + 1;
    this.desde = this.hasta = this.tipoSolicitud = '';
    this.fechaActa = 'CREACION';
    this.idProyecto = this.data.proyectoFijo ?? null;
    this.idCategoria = this.idResponsable = null;
    this.estadosSeleccionados = [];
    this.prioridadesSeleccionadas = [];
    this.rangoEdad = 'TODOS';
    this.proyectoValido = this.categoriaValida = this.responsableValido = true;
    this.validationError = '';
    this.resetKey++;
    this.categoriaResetKey++;
  }
  confirmar(): void {
    this.validationError = '';
    if (!this.proyectoValido || !this.categoriaValida || !this.responsableValido) {
      this.validationError = 'Selecciona las opciones de las sugerencias o limpia su búsqueda.';
      return;
    }
    let fechaInicio: string | undefined;
    let fechaFin: string | undefined;
    if (this.periodo === 'YEAR' || this.periodo === 'MONTH') {
      if (!Number.isInteger(this.anio) || this.anio < 1900 || this.anio > 9999 || !Number.isInteger(this.mes) || this.mes < 1 || this.mes > 12) {
        this.validationError = 'Indica un año válido (1900–9999) y un mes válido.';
        return;
      }
      const month = String(this.mes).padStart(2, '0');
      fechaInicio = `${this.anio}-${this.periodo === 'YEAR' ? '01' : month}-01`;
      fechaFin = this.periodo === 'YEAR' ? `${this.anio}-12-31` : `${this.anio}-${month}-${new Date(this.anio, this.mes, 0).getDate()}`;
    } else if (this.periodo === 'RANGE') {
      if (!this.desde || !this.hasta || this.desde > this.hasta) {
        this.validationError = 'Indica ambas fechas y verifica que Desde no sea posterior a Hasta.';
        return;
      }
      fechaInicio = this.desde;
      fechaFin = this.hasta;
    }
    this.dialog.close({
      alcance: this.periodo, fechaInicio, fechaFin, fechaActa: this.fechaActa,
      idProyecto: this.idProyecto ?? undefined, idCategoria: this.idCategoria ?? undefined,
      idResponsable: this.data.vinculaciones ? undefined : this.idResponsable ?? undefined,
      tipoSolicitud: this.data.vinculaciones ? undefined : this.tipoSolicitud.trim() || undefined,
      estadoActa: this.data.vinculaciones ? [] : [...this.estadosSeleccionados],
      prioridades: this.data.vinculaciones ? [] : [...this.prioridadesSeleccionadas],
      rangoEdad: this.data.actor ? this.rangoEdad : undefined,
      idsVinculaciones: this.data.filtro.idsVinculaciones,
      incluirActoresSinFecha: this.data.filtro.incluirActoresSinFecha ?? true,
    });
  }
}
