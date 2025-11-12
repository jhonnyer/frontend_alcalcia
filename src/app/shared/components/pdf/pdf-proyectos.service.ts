import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// asignar las fuentes (usa el namespace correcto)
(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Injectable({ providedIn: 'root' })
export class PdfGeneradorProyectoService {

  // Diccionario (enum) de estados de acta
  private readonly estadoActaLabels: Record<string, string> = {
    P: 'Pendiente',
    RC: 'Rechazado',
    R: 'Recibido',
    A: 'Autorizado',
    E: 'Entregado'
  };

  async generateProjectReport(data: any) {
    const proyecto = data.proyecto;
    const categorias = data.categorias || [];
    const beneficiarios = data.beneficiarios || [];
    const actas = data.actas || [];
    const parametros = data.parametros || {};
    const logoUrl = '/img/alcaldiaAlmaguer.png';
    const logo = await this.getBase64ImageFromAssets(logoUrl);

    // === IDs para navegación TOC ===
    const idProyecto = (proyecto?.nombre || 'Proyecto')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w_-]/g, '');

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 100, 40, 60],
      header: this.encabezado(logo, true),
      footer: (currentPage: number, pageCount: number) => ({
        margin: [40, 10, 40, 0],
        columns: [
          {
            text: '© Alcaldía Municipal de Almaguer - Departamento del Cauca',
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
        { text: 'REPORTE DETALLADO DEL PROYECTO', style: 'header', margin: [0, 0, 0, 10] },

        // === Tabla de contenido ===
        {
          toc: {
            title: { text: 'TABLA DE CONTENIDO', style: 'tocTitle' },
            numberStyle: { bold: true, color: '#2563EB' },
            textStyle: { color: '#1E3A8A' },
            linkToDestination: true,
          },
          margin: [0, 10, 0, 20]
        },
        { text: '', pageBreak: 'after' },

        // === Secciones navegables ===
        { text: '📘 Información del Proyecto', style: 'subheader', tocItem: true, id: `${idProyecto}_info` },
        this.generateProjectInfoTable(proyecto),
        { text: '', margin: [0, 5, 0, 5] },

        { text: '📦 Categorías y Productos', style: 'subheader', tocItem: true, id: `${idProyecto}_categorias` },
        ...this.generateCategoryTables(categorias),
        { text: '', margin: [0, 5, 0, 5] },

        { text: '👥 Beneficiarios del Proyecto', style: 'subheader', tocItem: true, id: `${idProyecto}_beneficiarios` },
        this.generateBeneficiariosTable(beneficiarios),
        { text: '', margin: [0, 5, 0, 5] },

        { text: '🧾 Actas Asociadas', style: 'subheader', tocItem: true, id: `${idProyecto}_actas` },
        ...this.generateActasTables(actas),
        { text: '', margin: [0, 5, 0, 5] },

        { text: '🏛️ Información Institucional', style: 'subheader', tocItem: true, id: `${idProyecto}_institucional` },
        this.generateParametrosTable(parametros),
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
        tocTitle: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          color: '#1E3A8A',
          margin: [0, 10, 0, 10],
        },
        tableHeader: {
          bold: true,
          fillColor: '#E5E7EB',
          color: '#111827',
          fontSize: 9,
          alignment: 'center'
        },
        sectionHeader: {
          bold: true,
          fontSize: 11,
          color: '#0f172a',
          fillColor: '#e0f2fe',
          margin: [0, 4, 0, 2],
        },
      },
      defaultStyle: {
        fontSize: 9,
        color: '#111827'
      }
    };

    pdfMake.createPdf(docDefinition).open();
  }

  // === Encabezado institucional transversal ===
  private encabezado(logo: string, esHeader: boolean = false) {
    const fecha = new Date();
    const fechaCompleta = fecha.toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const hora = fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit'
    });

    if (esHeader) {
      return () => ({
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
                  { text: 'ALCALDÍA MUNICIPAL DE ALMAGUER', bold: true, fontSize: 14, color: '#1E3A8A' },
                  { text: 'Departamento del Cauca - República de Colombia', fontSize: 10, color: '#374151' },
                  { text: `Generado el ${fechaCompleta}, ${hora}`, fontSize: 9, italics: true, color: '#6b7280', margin: [0, 3, 0, 0] }
                ],
                alignment: 'left'
              },
              {
                width: '30%',
                stack: [
                  { image: logo, fit: [70, 70], alignment: 'right', margin: [0, -5, 0, 0] }
                ]
              }
            ],
            columnGap: 10
          }
        ]
      });
    }
    return {};
  }

  // =====================================
  // 🔹 SECCIÓN: Información del proyecto (mejorada)
  // =====================================
  private generateProjectInfoTable(proyecto: any) {
    return {
      margin: [0, 0, 0, 10],
      table: {
        widths: ['35%', '65%'],
        body: [
          [
            { text: 'Nombre del Proyecto:', bold: true, fillColor: '#f3f4f6' },
            { text: proyecto.nombre || '—' },
          ],
          [
            { text: 'Descripción:', bold: true, fillColor: '#ffffff' },
            { text: proyecto.descripcion || 'Sin descripción' },
          ],
          [
            { text: 'Tipo de Proyecto:', bold: true, fillColor: '#f3f4f6' },
            { text: proyecto.tipoProyecto === 'M' ? 'Municipal' : 'Departamental' },
          ],
          [
            { text: 'Estado:', bold: true, fillColor: '#ffffff' },
            { text: proyecto.estado === 'A' ? 'Activo' : 'Inactivo' },
          ],
          [
            { text: 'Fecha Inicio:', bold: true, fillColor: '#f3f4f6' },
            { text: proyecto.fechaInicio || '—' },
          ],
          [
            { text: 'Fecha Fin:', bold: true, fillColor: '#ffffff' },
            { text: proyecto.fechaFin || '—' },
          ],
        ],
      },
      layout: {
        hLineColor: '#E5E7EB', // líneas suaves gris claro
        vLineColor: '#E5E7EB',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingTop: () => 4,
        paddingBottom: () => 4,
        paddingLeft: () => 6,
        paddingRight: () => 6,
      },
    };
  }

  // =====================================
  // 🔹 SECCIÓN: Categorías y productos
  // =====================================
  private generateCategoryTables(categorias: any[]) {
    const sections: any[] = [];
    // Si no hay categorías
    if (!categorias.length) {
      return [{ text: 'No hay categorías registradas.', italics: true }];
    }

    categorias.forEach((cat) => {
      sections.push({ text: `${cat.nombre}`, style: 'subheadertitulo' });
      // Si no tiene productos, mostrar mensaje
      if (!cat.productos || !cat.productos.length) {
        sections.push({
          text: 'Esta categoría no tiene productos asociados.',
          italics: true,
          color: '#6b7280',
          margin: [0, 4, 0, 8],
        });
        return; // pasa a la siguiente categoría
      }
      sections.push({
        table: {
          headerRows: 1,
          widths: ['25%', '40%', '20%', '15%'],
          body: [
            [
              { text: 'Producto', style: 'tableHeader' },
              { text: 'Descripción', style: 'tableHeader' },
              { text: 'Stock', style: 'tableHeader' },
              { text: 'Fecha Ingreso', style: 'tableHeader' },
            ],
            ...cat.productos.map((p: any) => [
              p.nombreProducto,
              p.descripcion || '—',
              p.stock,
              p.fechaIngreso || '',
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9F9F9' : null),
        },
      });
      sections.push({ text: '\n' });
    });

    return sections;
  }

  // =====================================
  // SECCIÓN: Beneficiarios
  // =====================================
  private generateBeneficiariosTable(beneficiarios: any[]) {
    if (!beneficiarios.length) {
      return { text: 'No hay beneficiarios asociados.', italics: true };
    }

    // 🔹 Separar activos e inactivos
    const activos = beneficiarios
      .filter((b) => b.esBeneficiarioActivo)
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));

    const inactivos = beneficiarios
      .filter((b) => !b.esBeneficiarioActivo)
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));

    const buildTable = (lista: any[], titulo: string, color: string) => {
      if (!lista.length) {
        return {
          text: `No hay beneficiarios ${titulo.toLowerCase()}.`,
          italics: true,
          color: '#6b7280',
          margin: [0, 4, 0, 8],
        };
      }
      return {
        stack: [
          { text: titulo, bold: true, color, margin: [0, 6, 0, 3] },
          {
            table: {
              headerRows: 1,
              widths: ['30%', '20%', '25%', '25%'],
              body: [
                [
                  { text: 'Nombre', style: 'tableHeader' },
                  { text: 'Documento', style: 'tableHeader' },
                  { text: 'Estado Beneficiario', style: 'tableHeader' },
                  { text: 'Fecha Inicio', style: 'tableHeader' },
                ],
                ...lista.map((b: any) => [
                  b.nombreCompleto,
                  b.numDocumentoBeneficiario,
                  b.esBeneficiarioActivo ? 'Activo' : 'Inactivo',
                  b.fechaInicio || '-',
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          },
          {
            text: `Total de beneficiarios ${titulo.toLowerCase()}: ${lista.length}`,
            alignment: 'right',
            bold: true,
            color,
            margin: [0, 3, 0, 10],
          },
        ],
      };
    };

     const observacion = {
      margin: [0, 4, 0, 0],
      text:
        'Nota: El listado anterior refleja los beneficiarios activos e inactivos asociados al proyecto según la información vigente en el sistema de gestión de inventarios. Los beneficiarios inactivos corresponden a personas dadas de baja o que ya no hacen parte del programa.',
      italics: true,
      fontSize: 9,
      color: '#374151',
    };

    // 🔹 Retorna ambas tablas (activos e inactivos)
    return {
      stack: [
        buildTable(activos, 'Beneficiarios Activos', '#065f46'),
        buildTable(inactivos, 'Beneficiarios Inactivos', '#7c2d12'),
        observacion
      ],
    };
  }


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

      return {
        margin: [0, 6, 0, 10],
        stack: [
          // =========================================
          // Encabezado del acta
          // =========================================
          {
            text: `ACTA #${acta.idActa} (${estadoLegible})`,
            style: 'subheadertitulo',
            alignment: 'left',
            margin: [0, 0, 0, 6],
          },

          // =========================================
          // Información general
          // =========================================
          {
            table: {
              widths: ['25%', '25%', '25%', '25%'],
              body: [
                [
                  { text: 'Fecha Creación', style: 'tableHeader' },
                  { text: 'Fecha Entrega', style: 'tableHeader' },
                  { text: 'Tipo Solicitud', style: 'tableHeader' },
                  { text: 'Responsable', style: 'tableHeader' },
                ],
                [
                  acta.fechaCreacion || '—',
                  acta.fechaEntrega || '—',
                  acta.tipoSolicitud || '—',
                  responsable || '—',
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
          // Productos entregados
          // =========================================
          ...(acta.detallesActaProductos?.length
            ? [
                {
                  margin: [0, 8, 0, 4],
                  stack: [
                    { text: ' Productos Entregados', style: 'sectionHeader' },
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
                            d.productos.map((p: any) => [
                              p.nombreProducto,
                              p.descripcion || '—',
                              p.cantidad,
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
              { text: ' Observaciones', style: 'sectionHeader' },
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

          // Línea divisoria
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
