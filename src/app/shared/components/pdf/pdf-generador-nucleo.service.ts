import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Injectable({ providedIn: 'root' })
export class PdfGeneradorNucleoService {

  private readonly estadoActaLabels: Record<string, string> = {
    P: 'Pendiente',
    RC: 'Rechazado',
    R: 'Recibido',
    A: 'Autorizado',
    E: 'Entregado'
  };

  async generateNucleoReport(detalle: any) {
    const logoUrl = '/img/alcaldiaAlmaguer.png';
    const logo = await this.getBase64ImageFromAssets(logoUrl);
    const docDefinition: any = {
      content: [
        this.encabezado(logo),

        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },
        { text: '\nREPORTE DETALLADO DEL ACTOR SOCIAL', style: 'header' },
        { text: '\n' },
        this.generateNucleoInfoTable(detalle),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\n Beneficiarios', style: 'subheader' },
        this.generateBeneficiariosTable(detalle.beneficiariosNucleo || []),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\n Beneficiarios con Proyectos', style: 'subheader' },
        this.generateProyectosTable(detalle.beneficiariosProyecto || []),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\n Actas Asociadas', style: 'subheader' },
        ...this.generateActasTables(detalle.actas || []),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\n Información Institucional', style: 'subheader' },
        this.generateParametrosTable(detalle.parametros),
      ],

      // ==============================
      // 🎨 ESTILOS PDFMAKE
      // ==============================
      styles: {
        // Encabezados principales
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#2C3E50',
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
          color: '#1E88E5',
          alignment: 'center',
        },
        subheadertitulo: {
          fontSize: 13,
          bold: true,
          color: '#0B3D91', 
          margin: [0, 8, 0, 4],
          decoration: 'underline',
          decorationColor: '#0B3D91',
        },
        // Encabezados de tabla
        tableHeader: {
          bold: true,
          fontSize: 10,
          fillColor: '#f3f4f6',
          color: '#111827'
        },

        // Encabezado de secciones (Productos, Observaciones, etc.)
        sectionHeader: {
          bold: true,
          fontSize: 11,
          color: '#0f172a',
          fillColor: '#e0f2fe',
          margin: [0, 4, 0, 2],
        },

        // Encabezados grises alternos
        tableHeaderGray: {
          fillColor: '#f3f4f6',
          color: '#374151',
          bold: true,
          fontSize: 10,
        },

        // Encabezados azules claros
        tableHeaderBlue: {
          fillColor: '#e0f2fe',
          color: '#0c4a6e',
          bold: true,
          fontSize: 10,
        },
      },

      // Estilo por defecto para todo el texto
      defaultStyle: {
        fontSize: 10,
        alignment: 'left',
      },

      // Márgenes de página
      pageMargins: [40, 60, 40, 40],
    };
    pdfMake.createPdf(docDefinition).open();
  }

   // ======= ENCABEZADO CENTRADO INSTITUCIONAL =======
  private encabezado(logo: string) {
    const fecha = new Date();
    const fechaCompleta = fecha.toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const hora = fecha.toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit'
    });

    return {
        margin: [20, 10, 20, 5],
        stack: [
        // 🔹 Línea azul superior
        {
            canvas: [
            {
                type: 'line',
                x1: -40,  // se sale del margen izquierdo
                y1: 0,
                x2: 525, // se extiende hasta antes del margen derecho
                y2: 0,
                lineWidth: 3,
                lineColor: '#1E3A8A'
            }
            ],
            margin: [0, 0, 0, 8]
        },
        // 🔹 Cabecera institucional (texto + logo)
        {
            columns: [
            {
                width: '70%', // ← proporción izquierda
                stack: [
                { text: 'ALCALDÍA MUNICIPAL DE ALMAGUER', bold: true, fontSize: 14, color: '#1E3A8A' },
                { text: 'Departamento del Cauca - República de Colombia', fontSize: 10, color: '#374151' },
                { text: `Generado el ${fechaCompleta}, ${hora}`, fontSize: 9, italics: true, color: '#6b7280', margin: [0, 3, 0, 0] }
                ],
                alignment: 'left'
            },
            {
                width: '30%', // ← proporción derecha
                stack: [
                {
                    image: logo,
                    fit: [70, 70], // 👈 evita usar dos veces width
                    alignment: 'right',
                    margin: [0, -5, 0, 0]
                }
                ]
            }
            ],
            columnGap: 10
        },

        // 🔹 Tabla de fecha
        {
            margin: [0, 10, 0, 0],
            table: {
            widths: ['*', '*', '*'],
            body: [
                [
                { text: 'AÑO', style: 'tableHeader', alignment: 'center' },
                { text: 'MES', style: 'tableHeader', alignment: 'center' },
                { text: 'DÍA', style: 'tableHeader', alignment: 'center' }
                ],
                [
                { text: fecha.getFullYear().toString(), alignment: 'center' },
                { text: (fecha.getMonth() + 1).toString().padStart(2, '0'), alignment: 'center' },
                { text: fecha.getDate().toString().padStart(2, '0'), alignment: 'center' }
                ]
            ]
            },
            layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#E5E7EB' : null),
            hLineColor: () => '#D1D5DB',
            vLineColor: () => '#D1D5DB'
            }
        },

        // 🔹 Línea inferior gris
        {
            canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 555, y2: 0, lineWidth: 1, lineColor: '#D1D5DB' }
            ],
            margin: [0, 8, 0, 0]
        }
        ]
    };
 }

  // ==============================
  // Información general del núcleo
  // ==============================
  private generateNucleoInfoTable(detalle: any) {
    return {
      table: {
        widths: ['30%', '70%'],
        body: [
          ['Nombre del Actor Social:', detalle.nombreNucleo || '—'],
          ['Dirección:', detalle.direccion || '—'],
          ['Zona:', detalle.nombreZona || '—'],
          ['Barrio:', detalle.nombreBarrio || '—'],
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
    return {
      table: {
        headerRows: 1,
        widths: ['20%', '20%', '15%', '15%', '10%','10%', '10%'],
        body: [
          [
            { text: 'Nombre', style: 'tableHeader' },
            { text: 'Documento', style: 'tableHeader' },
            { text: 'Edad', style: 'tableHeader' },
            { text: 'Genero', style: 'tableHeader' },
            { text: 'Vivo', style: 'tableHeader' },
            { text: 'Discapacidad', style: 'tableHeader' },
            { text: 'Victima conflicto', style: 'tableHeader' },
          ],
          ...beneficiarios.map(b => [
            `${b.primerNombre} ${b.primerApellido}`,
            b.numeroDocumento,
            b.edad,
            (b.genero ?? '—').toString().toUpperCase(), 
            b.esVivo ? 'Sí' : 'No',
            b.discapacidad ? 'Sí' : 'No',
            b.victimaConflicto ? 'Sí' : 'No'
          ])
        ]
      },
      layout: 'lightHorizontalLines'
    };
  }

  // ==============================
  // Beneficiarios con proyectos
  // ==============================
  private generateProyectosTable(beneficiariosProyecto: any[]) {
    if (!beneficiariosProyecto.length) {
      return { text: 'No hay beneficiarios con proyectos asociados.', italics: true };
    }

    return {
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
          ...beneficiariosProyecto.map(bp => [
            bp.nombreCompleto,
            bp.nombreProyecto,
            bp.estadoProyecto,
            bp.esBeneficiarioActivo ? 'Sí' : 'No'
          ])
        ]
      },
      layout: 'lightHorizontalLines'
    };
  }

  // ==============================
  // Actas asociadas (versión con marcos y presentación mejorada)
  // ==============================
  private generateActasTables(actas: any[]) {
    if (!actas.length) {
      return [{ text: 'No hay actas asociadas.', italics: true }];
    }

    return actas.map((acta) => {
      const estadoLegible = this.estadoActaLabels[acta.estado] || acta.estado;

      const beneficiario = acta.beneficiario
        ? `${acta.beneficiario.primerNombre ?? ''} ${acta.beneficiario.segundoNombre ?? ''} ${acta.beneficiario.primerApellido ?? ''} ${acta.beneficiario.segundoApellido ?? ''}`.trim()
        : '—';
      const documento = acta.beneficiario?.numeroDocumento ?? '—';
      const responsable = `${acta.responsable?.primerNombre ?? ''} ${acta.responsable?.segundoNombre ?? ''} ${acta.responsable?.primerApellido ?? ''} ${acta.responsable?.segundoApellido ?? ''}`.trim();
      const proyecto = acta.proyecto?.nombre ?? '—';

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
          ...(acta.detallesActaProductos?.length
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
                          ...acta.detallesActaProductos.flatMap((d: any) =>
                            (d.productos ?? []).map((p: any) => [
                              p.nombreProducto || '—',
                              p.descripcion || '—',
                              p.cantidad ?? '—',
                            ])
                          ),
                        ],
                      },
                      layout: 'lightHorizontalLines',
                    },
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
  }


  // =====================================
  // SECCIÓN: Parámetros institucionales
  // =====================================
  private generateParametrosTable(parametros: any) {
    if (!parametros) {
      return { text: 'Sin información institucional.', italics: true };
    }

    return {
      table: {
        widths: ['35%', '65%'],
        body: [
          [
            { text: 'Nombre de la Alcaldía:', style: 'tableHeader' },
            parametros.nombreAlcaldia || '—'
          ],
          [
            { text: 'Nombre del Alcalde:', style: 'tableHeader' },
            parametros.nombreAlcalde || '—'
          ],
          [
            { text: 'Nombre de la Secretaría:', style: 'tableHeader' },
            parametros.nombreSecretaria || '—'
          ],
          [
            { text: 'Correo institucional:', style: 'tableHeader' },
            parametros.correoAlcaldia || '—'
          ],
          [
            { text: 'Dirección de la Alcaldía:', style: 'tableHeader' },
            parametros.direccionAlcaldia || '—'
          ],
          [
            { text: 'Teléfono de contacto:', style: 'tableHeader' },
            parametros.contactoAlcaldia || '—'
          ],
          [
            { text: 'Código Postal:', style: 'tableHeader' },
            parametros.codigoPostal || '—'
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
   // ============================
  // 🔹 Convierte una imagen local a Base64
  // ============================
  private async getBase64ImageFromAssets(imagePath: string): Promise<string> {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
