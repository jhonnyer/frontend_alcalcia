import { Injectable, inject } from '@angular/core';
import { openPdfWithoutBlocking } from './pdf-export.utils';
import { InstitucionPdf, PdfInstitucionalService, sectorPdf, sexoPdf, textoPdf } from './pdf-institucional.service';

@Injectable({ providedIn: 'root' })
export class PdfGeneradorNucleoService {
  private readonly institucional = inject(PdfInstitucionalService);

  private readonly MAX_BENEFICIARIOS = 220;
  private readonly MAX_BENEFICIARIOS_PROYECTO = 220;
  private readonly MAX_ACTAS = 80;
  private readonly MAX_PRODUCTOS_POR_ACTA = 80;

  private readonly estadoActaLabels: Record<string, string> = {
    P: 'Pendiente',
    RC: 'Rechazado',
    R: 'Recibido',
    A: 'Autorizado',
    E: 'Entregado'
  };

  async generateNucleoReport(detalle: any) {
    const institucion = await this.institucional.cargar();

    const fecha = new Date().toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

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
        {
          text: 'REPORTE DETALLADO DEL ACTOR SOCIAL',
          style: 'header',
          margin: [0, 20, 0, 10],
          id: 'reporteActor'
        },

        // ============================
        // TABLA DE CONTENIDO
        // ============================
        { text: 'TABLA DE CONTENIDO', style: 'tocTitle' },
        {
          toc: {
            title: { text: 'Contenido', style: 'tocSubTitle' },
            numberStyle: { bold: true, color: '#2563EB' },
            textStyle: { color: '#1E3A8A' },
            linkToDestination: true
          },
          margin: [0, 10, 0, 20]
        },
        { text: '', pageBreak: 'after' },

        // ===== Sección 1 =====
        this.section('infoActor', 'Información del Actor Social', this.generateNucleoInfoTable(detalle)),

        // ===== Sección 2 =====
        this.section('beneficiarios', 'Beneficiarios', this.generateBeneficiariosTable(detalle.beneficiariosNucleo || [])),

        // ===== Sección 3 =====
        this.section('beneficiariosProyectos', 'Beneficiarios con Proyectos', this.generateProyectosTable(detalle.beneficiariosProyecto || [])),

        // ===== Sección 4 =====
        this.section('actasAsociadas', 'Actas Asociadas', this.generateActasTables(detalle.actas || [])),

        // ===== Sección 5 =====
        this.section('infoInstitucional', 'Información Institucional', this.generateParametrosTable(institucion)),
      ],

      styles: {
        header: {
          fontSize: 16,
          bold: true,
          color: '#1E3A8A',
          alignment: 'center',
          margin: [0, 5, 0, 5]
        },
        subheader: {
          fontSize: 13,
          bold: true,
          color: '#2563EB',
          margin: [0, 8, 0, 4],
          alignment: 'center'
        },
        tableHeader: {
          bold: true,
          fillColor: '#E5E7EB',
          color: '#111827',
          fontSize: 9,
          alignment: 'center'
        },
        subheadertitulo: {
          fontSize: 13,
          bold: true,
          color: '#1E3A8A',
          margin: [0, 8, 0, 4]
        },
        sectionHeader: {
          bold: true,
          fontSize: 11,
          color: '#0f172a',
          fillColor: '#e0f2fe',
          margin: [0, 4, 0, 2]
        },
        tocTitle: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#1E3A8A',
          margin: [0, 10, 0, 10]
        },
        tocSubTitle: {
          fontSize: 13,
          bold: true,
          color: '#2563EB',
          margin: [0, 0, 0, 10],
          alignment: 'left'
        },
        sectionTitle: {
          fontSize: 13,
          bold: true,
          color: '#2563EB',
          margin: [0, 10, 0, 6],
          alignment: 'left'
        },
        tocEntry: {
          fontSize: 11,
          color: '#111827',
          margin: [0, 2, 0, 2],
          alignment: 'left'
        },
        tocEntryLevel2: {
          fontSize: 10,
          color: '#374151',
          margin: [15, 1, 0, 1],
          alignment: 'left'
        },
      },
      defaultStyle: {
        fontSize: 10,
        color: '#111827'
      }
    };

    await openPdfWithoutBlocking(docDefinition, 'reporte-actor-social.pdf');
  }

  // =====================================
  // Método auxiliar para secciones TOC seguras
  // =====================================
  private section(id: string, title: string, content: any) {
    return {
      stack: [
        { text: title, style: 'sectionTitle', id, tocItem: true, margin: [0, 10, 0, 6] },
        Array.isArray(content) ? { stack: content } : content
      ],
      margin: [0, 5, 0, 5]
    };
  }


  // ======= ENCABEZADO TRANSVERSAL =======
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
          // 🔹 Línea azul superior
          {
            canvas: [
              { type: 'line', x1: -40, y1: 0, x2: 555, y2: 0, lineWidth: 3, lineColor: '#1E3A8A' }
            ],
            margin: [0, 0, 0, 8]
          },
          // 🔹 Encabezado institucional
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

    // Evita error TS7030
    return {};
  }

  // ==============================
  // Información general del núcleo
  // ==============================
  private generateNucleoInfoTable(detalle: any) {
    return {
      table: {
        widths: ['30%', '70%'],
        body: [
          ['Nombre del Actor Social:', textoPdf(detalle.nombreNucleo)],
          ['Dirección:', textoPdf(detalle.direccion)],
          ['Zona:', textoPdf(detalle.nombreZona)],
          [`${sectorPdf(detalle.ubicacion)}:`, textoPdf(detalle.nombreBarrio)],
          ['Número de Integrantes:', detalle.numeroIntegrantes ?? '—'],
        ]
      },
      layout: 'noBorders'
    };
  }

  // ==============================
  // Beneficiarios del núcleo
  // ==============================
  private generateBeneficiariosTable(beneficiarios: any[]) {
    if (!beneficiarios.length) {
      return { text: 'No hay beneficiarios registrados.', italics: true };
    }

    const beneficiariosLimitados = this.limitRows(beneficiarios, this.MAX_BENEFICIARIOS);

    return {
      stack: [
        {
          table: {
            headerRows: 1,
            widths: ['20%', '20%', '15%', '15%', '10%','10%', '10%'],
            body: [
              [
                { text: 'Nombre', style: 'tableHeader' },
                { text: 'Documento', style: 'tableHeader' },
                { text: 'Edad', style: 'tableHeader' },
                { text: 'Sexo', style: 'tableHeader' },
                { text: 'Vivo', style: 'tableHeader' },
                { text: 'Discapacidad', style: 'tableHeader' },
                { text: 'Víctima del conflicto', style: 'tableHeader' },
              ],
              ...beneficiariosLimitados.items.map(b => [
                textoPdf([b.primerNombre, b.segundoNombre, b.primerApellido, b.segundoApellido].filter(Boolean).join(' ')),
                b.numeroDocumento,
                b.edad,
                sexoPdf(b.sexo),
                b.esVivo ? 'Sí' : 'No',
                b.discapacidad ? 'Sí' : 'No',
                b.victimaConflicto ? 'Sí' : 'No'
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        ...(beneficiariosLimitados.omitted > 0
          ? [{
              text: `Se muestran ${beneficiariosLimitados.items.length} beneficiarios. Se omitieron ${beneficiariosLimitados.omitted} para agilizar el reporte.`,
              italics: true,
              fontSize: 9,
              color: '#6b7280',
              margin: [0, 4, 0, 0],
            }]
          : []),
      ]
    };
  }

  // ==============================
  // Beneficiarios con proyectos
  // ==============================
  private generateProyectosTable(beneficiariosProyecto: any[]) {
    if (!beneficiariosProyecto.length) {
      return { text: 'No hay beneficiarios con proyectos asociados.', italics: true };
    }

    const beneficiariosProyectoLimitados = this.limitRows(beneficiariosProyecto, this.MAX_BENEFICIARIOS_PROYECTO);

    return {
      stack: [
        {
          table: {
            headerRows: 1,
            widths: ['35%', '25%', '20%', '20%'],
            body: [
              [
                { text: 'Beneficiario', style: 'tableHeader' },
                { text: 'Proyecto', style: 'tableHeader' },
                { text: 'Estado Proyecto', style: 'tableHeader' },
                { text: 'Asignación Proyecto', style: 'tableHeader' },
              ],
              ...beneficiariosProyectoLimitados.items.map(bp => [
                textoPdf(bp.nombreCompleto),
                bp.nombreProyecto,
                bp.estadoProyecto,
                bp.esBeneficiarioActivo ? 'Sí' : 'No'
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        ...(beneficiariosProyectoLimitados.omitted > 0
          ? [{
              text: `Se muestran ${beneficiariosProyectoLimitados.items.length} registros. Se omitieron ${beneficiariosProyectoLimitados.omitted} para agilizar el reporte.`,
              italics: true,
              fontSize: 9,
              color: '#6b7280',
              margin: [0, 4, 0, 0],
            }]
          : []),
      ]
    };
  }

  // ==============================
  // Actas asociadas (versión con marcos y presentación mejorada)
  // ==============================
  private generateActasTables(actas: any[]) {
    if (!actas.length) {
      return [{ text: 'No hay actas asociadas.', italics: true }];
    }

    const actasLimitadas = this.limitRows(actas, this.MAX_ACTAS);

    const bloques: any[] = actasLimitadas.items.map((acta) => {
      const estadoLegible = this.estadoActaLabels[acta.estado] || acta.estado;

      const beneficiario = acta.beneficiario
        ? `${acta.beneficiario.primerNombre ?? ''} ${acta.beneficiario.segundoNombre ?? ''} ${acta.beneficiario.primerApellido ?? ''} ${acta.beneficiario.segundoApellido ?? ''}`.trim()
        : '—';
      const documento = acta.beneficiario?.numeroDocumento ?? '—';
      const responsable = `${acta.responsable?.primerNombre ?? ''} ${acta.responsable?.segundoNombre ?? ''} ${acta.responsable?.primerApellido ?? ''} ${acta.responsable?.segundoApellido ?? ''}`.trim();
      const proyecto = acta.proyecto?.nombre ?? '—';
      const productosActa = this.limitRows(
        acta.detallesActaProductos?.flatMap((d: any) => (d.productos ?? [])) || [],
        this.MAX_PRODUCTOS_POR_ACTA
      );

      return {
        margin: [0, 6, 0, 10],
        stack: [
          // =========================================
          // Encabezado del acta
          // =========================================
          {
            text: ` ACTA #${acta.idActa} (${estadoLegible})`,
            style: 'subheadertitulo',
            alignment: 'left',
            margin: [0, 0, 0, 6],
          },

          // =========================================
          // Información general del acta
          // =========================================
          {
            table: {
              widths: ['25%', '25%', '25%', '25%'],
              body: [
                [
                  { text: 'Fecha Creación', style: 'tableHeader' },
                  { text: 'Fecha Entrega', style: 'tableHeader' },
                  { text: 'Tipo Solicitud', style: 'tableHeader' },
                  { text: 'Proyecto', style: 'tableHeader' },
                ],
                [
                  acta.fechaCreacion || '—',
                  acta.fechaEntrega || '—',
                  acta.tipoSolicitud || '—',
                  proyecto,
                ],
                [
                  { text: 'Responsable', style: 'tableHeader' },
                  { text: responsable, colSpan: 3, alignment: 'left' },
                  {},
                  {},
                ],
                [
                  { text: 'Beneficiario', style: 'tableHeader' },
                  { text: beneficiario, colSpan: 2 },
                  {},
                  { text: `Documento: ${documento}` },
                ],
              ],
            },
            layout: 'lightHorizontalLines',
          },

          // =========================================
          // Bloque de productos
          // =========================================
          ...(productosActa.items.length
            ? [
                {
                  margin: [0, 8, 0, 4],
                  stack: [
                    {
                      text: '📦 Productos Entregados',
                      style: 'sectionHeader',
                      margin: [0, 2, 0, 4],
                    },
                    {
                      table: {
                        headerRows: 1,
                        widths: ['40%', '40%', '20%'],
                        body: [
                          [
                            { text: 'Producto', style: 'tableHeader' },
                            { text: 'Descripción', style: 'tableHeader' },
                            { text: 'Cantidad', style: 'tableHeader' },
                          ],
                          ...productosActa.items.map((p: any) => [
                            p.nombreProducto || '—',
                            p.descripcion || '—',
                            p.cantidad ?? '—',
                          ]),
                        ],
                      },
                      layout: 'lightHorizontalLines',
                    },
                    ...(productosActa.omitted > 0
                      ? [{
                          text: `Se muestran ${productosActa.items.length} productos. Se omitieron ${productosActa.omitted} para agilizar el reporte.`,
                          italics: true,
                          fontSize: 9,
                          color: '#6b7280',
                          margin: [0, 4, 0, 0],
                        }]
                      : []),
                  ],
                },
              ]
            : [
                {
                  margin: [0, 8, 0, 4],
                  text: '📦 Sin productos registrados.',
                  italics: true,
                  color: '#6b7280',
                },
              ]),

          // =========================================
          // Observaciones
          // =========================================
          {
            margin: [0, 6, 0, 8],
            stack: [
              {
                text: '📝 Observaciones',
                style: 'sectionHeader',
                margin: [0, 2, 0, 4],
              },
              {
                text:
                  acta.observaciones && acta.observaciones.trim() !== ''
                    ? acta.observaciones
                    : '— Sin observaciones —',
                italics: true,
                color: '#374151',
              },
            ],
          },

          // Línea divisoria entre actas
          { text: '', margin: [0, 0, 0, 6] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#9ca3af' }] },
        ],
      };
    });

    if (actasLimitadas.omitted > 0) {
      bloques.push({
        text: `Se muestran ${actasLimitadas.items.length} actas. Se omitieron ${actasLimitadas.omitted} para agilizar el reporte.`,
        italics: true,
        fontSize: 9,
        color: '#6b7280',
        margin: [0, 6, 0, 0],
      });
    }

    return bloques;
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


  // =====================================
  // SECCIÓN: Parámetros institucionales
  // =====================================
  private generateParametrosTable(institucion: InstitucionPdf) {
    const parametros = institucion.parametros;
    if (!parametros) {
      return { text: 'Sin información institucional.', italics: true };
    }

    return {
      table: {
        widths: ['35%', '65%'],
        body: [
          [
            { text: `Nombre de la ${institucion.entidad}:`, style: 'tableHeader' },
            textoPdf(parametros.nombreAlcaldia)
          ],
          [
            { text: `Nombre del ${institucion.autoridad}:`, style: 'tableHeader' },
            textoPdf(parametros.nombreAlcalde)
          ],
          [
            { text: 'Nombre de la Secretaría:', style: 'tableHeader' },
            textoPdf(parametros.nombreSecretaria)
          ],
          [
            { text: 'Correo institucional:', style: 'tableHeader' },
            textoPdf(parametros.correoAlcaldia)
          ],
          [
            { text: `Dirección de la ${institucion.entidad}:`, style: 'tableHeader' },
            textoPdf(parametros.direccionAlcaldia)
          ],
          [
            { text: 'Teléfono de contacto:', style: 'tableHeader' },
            textoPdf(parametros.contactoAlcaldia)
          ],
          [
            { text: 'Código Postal:', style: 'tableHeader' },
            textoPdf(parametros.codigoPostal)
          ]
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9F9F9' : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#E0E0E0',
      },
    };
  }
}
