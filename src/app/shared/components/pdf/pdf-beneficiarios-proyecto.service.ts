import { Injectable, inject } from '@angular/core';
import { IBeneficiarioProyecto } from '../../../core/models/beneficiarioProyecto.model';
import { openPdfWithoutBlocking } from './pdf-export.utils';
import { InstitucionPdf, PdfInstitucionalService, textoPdf } from './pdf-institucional.service';

@Injectable({ providedIn: 'root' })
export class PdfBeneficiariosProyectoService {
  private readonly institucional = inject(PdfInstitucionalService);

  private readonly MAX_BENEFICIARIOS_POR_BLOQUE = 220;

  async generarReporte(data: IBeneficiarioProyecto[]) {
    const institucion = await this.institucional.cargar();

    if (!data?.length) {
      await openPdfWithoutBlocking({
        content: [{ text: 'No hay beneficiarios registrados.', italics: true }],
      }, 'beneficiarios-proyecto.pdf');
      return;
    }

    // 🔹 Agrupar beneficiarios por proyecto y estado
    const proyectosMap = new Map<string, { estado: string, beneficiarios: IBeneficiarioProyecto[] }>();
    data.forEach(b => {
      const nombreProyecto = b.nombreProyecto || 'Proyecto sin nombre';
      const estadoProyecto = b.estadoProyecto || 'A';
      if (!proyectosMap.has(nombreProyecto)) {
        proyectosMap.set(nombreProyecto, { estado: estadoProyecto, beneficiarios: [] });
      }
      proyectosMap.get(nombreProyecto)!.beneficiarios.push(b);
    });

    // 🔹 Crear secciones por proyecto
    const secciones = Array.from(proyectosMap.entries()).map(([proyecto, { estado, beneficiarios }]) => {
      const activos = beneficiarios.filter(b => b.esBeneficiarioActivo)
        .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
      const inactivos = beneficiarios.filter(b => !b.esBeneficiarioActivo)
        .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));

      const totalActivos = activos.length;
      const totalInactivos = inactivos.length;
      const totalGeneral = beneficiarios.length;

      const buildTable = (lista: IBeneficiarioProyecto[], titulo: string, color: string) => {
        const listaLimitada = this.limitRows(lista, this.MAX_BENEFICIARIOS_POR_BLOQUE);
        if (!lista.length) {
          return {
            text: `No hay beneficiarios ${titulo.toLowerCase()}.`,
            italics: true,
            color: '#6b7280',
            margin: [0, 4, 0, 10],
          };
        }
        return {
          stack: [
            { text: titulo, bold: true, color, margin: [0, 8, 0, 4] },
            {
              table: {
                widths: ['5%', '26%', '7%', '12%', '10%', '12%', '13%', '15%'],
                body: [
                  [
                    { text: '#', style: 'tableHeader' },
                    { text: 'Nombre Completo', style: 'tableHeader' },
                    { text: 'Edad', style: 'tableHeader' },
                    { text: 'Documento', style: 'tableHeader' },
                    { text: 'Estado', style: 'tableHeader' },
                    { text: 'Actor Social', style: 'tableHeader' },
                    { text: 'Barrio / Vereda', style: 'tableHeader' },
                    { text: 'Observaciones', style: 'tableHeader' },
                  ],
                  ...listaLimitada.items.map((b, i) => [
                    i + 1,
                    textoPdf(b.nombreCompleto),
                    b.edadBeneficiario ?? '—',
                    textoPdf(b.numDocumentoBeneficiario),
                    b.esBeneficiarioActivo ? 'Activo' : 'Inactivo',
                    b.nombreNucleo || '—',
                    b.nombreBarrio || '—',
                    b.observaciones || '—'
                  ])
                ]
              },
              layout: {
                fillColor: (rowIndex: number) =>
                  rowIndex === 0 ? '#E5E7EB' : rowIndex % 2 === 0 ? '#F9FAFB' : null,
                hLineColor: () => '#E5E7EB',
                vLineColor: () => '#E5E7EB',
              },
              fontSize: 9,
            },
            ...(listaLimitada.omitted > 0
              ? [{
                  text: `Se muestran ${listaLimitada.items.length} registros. Se omitieron ${listaLimitada.omitted} para agilizar el reporte.`,
                  italics: true,
                  fontSize: 9,
                  color: '#6b7280',
                  margin: [0, 4, 0, 2],
                }]
              : []),
            {
              text: `Total de beneficiarios ${titulo.toLowerCase()}: ${lista.length}`,
              alignment: 'right',
              bold: true,
              color,
              margin: [0, 4, 0, 10],
            }
          ]
        };
      };

      const idProyecto = proyecto
        .normalize("NFD") // elimina tildes
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_") // reemplaza espacios
        .replace(/[^\w_-]/g, "");
     
        return {
        estado,
        id: idProyecto,
        stack: [
          { text: proyecto, style: 'subheader', color: '#1E3A8A', tocItem: true, id: proyecto },
          {
            text: `Resumen general: ${totalActivos} activos, ${totalInactivos} inactivos (total ${totalGeneral})`,
            style: 'resumenProyecto',
            margin: [0, 2, 0, 8],
          },
          buildTable(activos, 'Beneficiarios Activos', '#065f46'),
          buildTable(inactivos, 'Beneficiarios Inactivos', '#7c2d12'),
          {
            text:
              'Observación: El listado refleja los beneficiarios asociados al proyecto. Los beneficiarios inactivos corresponden a personas dadas de baja o no activas actualmente en el proyecto.',
            italics: true,
            fontSize: 9,
            color: '#374151',
            margin: [0, 2, 0, 10],
          },
        ]
      };
    });

    const proyectosActivos = secciones.filter(s => s.estado === 'A');
    const proyectosInactivos = secciones.filter(s => s.estado === 'I');

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 130, 40, 60],
      header: this.encabezado(institucion, true),
      footer: (currentPage: number, pageCount: number) => ({
        margin: [40, 10, 40, 0],
        columns: [
          {
            text: institucion.pie,
            alignment: 'left',
            fontSize: 8,
            color: '#6b7280'
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'right',
            fontSize: 8,
            color: '#6b7280'
          }
        ]
      }),

      content: [
        { text: 'REPORTE DE BENEFICIARIOS POR PROYECTO', style: 'header', margin: [0, 0, 0, 10]},
        {
          toc: {
            title: { text: 'TABLA DE CONTENIDO', style: 'tocTitle' },
            numberStyle: { bold: true, color: '#2563EB' },
            textStyle: { color: '#1E3A8A' },
            linkToDestination: true
          },
          margin: [0, 10, 0, 20]
        },
        { text: '', pageBreak: 'after' },

        ...(proyectosActivos.length
          ? [
              { text: '🟢 Proyectos Activos', style: 'header', color: '#065f46', tocItem: true, id: 'Proyectos_Activos' },
              ...proyectosActivos
            ]
          : []),

        ...(proyectosInactivos.length
          ? [
              { text: '🔴 Proyectos Inactivos', style: 'header', color: '#7c2d12', tocItem: true, id: 'Proyectos_Inactivos'},
              ...proyectosInactivos
            ]
          : [])
      ],

      styles: {
        header: {
          fontSize: 15,
          bold: true,
          color: '#1E3A8A',
          alignment: 'center',
          margin: [0, 5, 0, 5]
        },
        subheader: {
          fontSize: 13,
          bold: true,
          color: '#2563EB',
          margin: [0, 8, 0, 4]
        },
        fecha: {
          fontSize: 10,
          italics: true,
          color: '#6b7280',
          alignment: 'center'
        },
        tableHeader: {
          bold: true,
          fillColor: '#E5E7EB',
          color: '#111827',
          fontSize: 9,
          alignment: 'center'
        },
        resumenProyecto: {
          fontSize: 10,
          italics: true,
          color: '#374151',
          alignment: 'left',
        },
        tocTitle: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          color: '#1E3A8A',
          margin: [0, 10, 0, 10],
        },
        tocEntry: {
          fontSize: 11,
          color: '#111827',
          margin: [0, 2, 0, 2],
        },
      },
      defaultStyle: {
        fontSize: 9,
        color: '#111827'
      }
    };

    await openPdfWithoutBlocking(docDefinition, 'beneficiarios-proyecto.pdf');
  }

  private limitRows<T>(items: T[] | null | undefined, max: number): { items: T[]; omitted: number } {
    const normalized = Array.isArray(items) ? items : [];
    if (normalized.length <= max) {
      return { items: normalized, omitted: 0 };
    }
    return {
      items: normalized.slice(0, max),
      omitted: normalized.length - max,
    };
  }

  // ======= ENCABEZADO INSTITUCIONAL TRANSVERSAL =======
  private encabezado(institucion: InstitucionPdf, esHeader: boolean = false) {
    const fecha = new Date();
    const fechaCompleta = fecha.toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const hora = fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit'
    });

    if (esHeader) {
      return (currentPage: number, pageCount: number) => ({
        margin: [40, 15, 40, 0],
        stack: [
          {
            canvas: [
              { type: 'line', x1: -40, y1: 0, x2: 555, y2: 0, lineWidth: 3, lineColor: '#1E3A8A' }
            ],
            margin: [0, 0, 0, 8]
          },
          {
            columns: [
              {
                width: '70%',
                stack: [
                  { text: institucion.nombre, bold: true, fontSize: 14, color: '#1E3A8A' },
                  { text: institucion.subtitulo, fontSize: 10, color: '#374151' },
                  { text: `Generado el ${fechaCompleta}, ${hora}`, fontSize: 9, italics: true, color: '#6b7280', margin: [0, 3, 0, 0] }
                ],
                alignment: 'left'
              },
              {
                width: '30%',
                stack: [
                  { image: institucion.logo, fit: [70, 70], alignment: 'right', margin: [0, -5, 0, 0] }
                ]
              }
            ],
            columnGap: 10
          }
        ]
      });
    }

    // 🔹 Si no es header global, devolvemos un bloque vacío (para evitar error TS7030)
    return {};
  }


}
