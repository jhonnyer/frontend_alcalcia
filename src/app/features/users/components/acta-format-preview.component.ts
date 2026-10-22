import { Component, Input } from '@angular/core';
import { LogoPreviewComponent } from './logo-preview.component';

@Component({
  selector: 'app-acta-format-preview',
  standalone: true,
  imports: [LogoPreviewComponent],
  template: `
    <figure class="mt-4 min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <figcaption class="text-sm font-semibold text-slate-800">Vista previa del encabezado</figcaption>
      <p class="mt-1 text-xs text-slate-500">Se actualiza mientras escribes. Es una guía de ubicación, no el PDF final. Los campos vacíos muestran ejemplos que no se guardan.</p>
      <div tabindex="0" role="region" aria-label="Encabezado de ejemplo del acta, desplazable horizontalmente"
        class="mt-3 overflow-x-auto rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
        <table class="w-full min-w-[580px] table-fixed border-collapse border border-slate-600 text-xs text-slate-900">
          <colgroup><col class="w-1/5" /><col class="w-1/2" /><col class="w-[30%]" /></colgroup>
          <tbody>
            <tr>
              <td rowspan="4" class="border border-slate-600 p-2 align-middle">
                <app-logo-preview [logo]="logo || ''" [compact]="true"></app-logo-preview>
              </td>
              <td rowspan="2" class="border border-slate-600 p-3 text-center align-middle font-bold uppercase [overflow-wrap:anywhere]"
                [class.text-slate-400]="!encabezado?.trim()">
                {{ encabezado?.trim() || 'Nombre de la dependencia' }}
              </td>
              <td class="border border-slate-600 p-2 align-top [overflow-wrap:anywhere]">
                Código: <span [class.text-slate-400]="!codigo?.trim()">{{ codigo?.trim() || 'SDAEE 180.02' }}</span>
              </td>
            </tr>
            <tr>
              <td class="border border-slate-600 p-2 align-top [overflow-wrap:anywhere]">
                Versión: <span [class.text-slate-400]="!version?.trim()">{{ version?.trim() || '02' }}</span>
              </td>
            </tr>
            <tr>
              <td rowspan="2" class="border border-slate-600 p-2 text-center align-middle">ACTA DE RECIBIDO N° 000</td>
              <td class="border border-slate-600 p-2 align-top">
                Fecha de Aprobación: <span [class.text-slate-400]="!fecha">{{ fechaVisible }}</span>
              </td>
            </tr>
            <tr><td class="border border-slate-600 p-2 align-top">Página 1</td></tr>
          </tbody>
        </table>
      </div>
      <p class="mt-2 text-xs text-slate-500">El tipo, número de acta y página son ilustrativos. En móvil puedes deslizar el encabezado horizontalmente.</p>
      <div class="mt-3 rounded-md border border-dashed border-slate-300 p-3">
        <p class="text-xs text-slate-500">Firmas al final del acta: el almacenista junto al responsable y la máxima autoridad en una fila completa.</p>
        <div class="mt-3 grid grid-cols-2 gap-3 text-xs [overflow-wrap:anywhere]">
          <div class="text-slate-400">
            <div class="mt-4 border-t border-slate-400 pt-1">FIRMA RESPONSABLE</div>
          </div>
          <div>
            <div class="mt-4 border-t border-slate-500 pt-1">
              <p class="font-semibold uppercase" [class.text-slate-400]="!nombreAlmacenista?.trim()">FIRMA {{ cargoAlmacenista?.trim() || 'Almacenista General' }}</p>
              <p [class.text-slate-400]="!nombreAlmacenista?.trim()">Nombre: {{ nombreAlmacenista?.trim() || 'Nombre del almacenista' }}</p>
            </div>
          </div>
        </div>
        <div class="mx-auto mt-6 max-w-sm border-t border-slate-500 pt-1 text-center text-xs [overflow-wrap:anywhere]">
          <p class="font-semibold uppercase" [class.text-slate-400]="!firma?.trim()">{{ firma?.trim() || 'Cargo de la máxima autoridad' }}</p>
          <p [class.text-slate-400]="!nombreAutoridad?.trim()">Nombre: {{ nombreAutoridad?.trim() || 'Nombre de la autoridad' }}</p>
        </div>
        @if (!nombreAlmacenista?.trim()) {
          <p class="mt-3 text-xs text-amber-700">Sin nombre del almacenista, el acta conserva el formato anterior: la máxima autoridad firma junto al responsable.</p>
        }
      </div>
    </figure>
  `,
})
export class ActaFormatPreviewComponent {
  @Input() encabezado: string | null = '';
  @Input() codigo: string | null = '';
  @Input() version: string | null = '';
  @Input() fecha: string | null = '';
  @Input() firma: string | null = '';
  @Input() nombreAutoridad: string | null = '';
  @Input() nombreAlmacenista: string | null = '';
  @Input() cargoAlmacenista: string | null = '';
  @Input() logo: string | null = '';

  get fechaVisible(): string {
    if (!this.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(this.fecha)) return '19/03/2025';
    const [anio, mes, dia] = this.fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
}
