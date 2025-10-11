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

  generateProjectReport(data: any) {
    const proyecto = data.proyecto;
    const categorias = data.categorias || [];
    const beneficiarios = data.beneficiarios || [];
    const actas = data.actas || [];
    const parametros = data.parametros || {};

    const docDefinition: any = {
      content: [
        { text: 'REPORTE DETALLADO DEL PROYECTO', style: 'header' },
        { text: '\n' },
        this.generateProjectInfoTable(proyecto),

        { text: '\n Categorías y Productos', style: 'subheader' },
        ...this.generateCategoryTables(categorias),

        { text: '\n Beneficiarios del Proyecto', style: 'subheader' },
        this.generateBeneficiariosTable(beneficiarios),

        { text: '\n Actas Asociadas', style: 'subheader' },
        ...this.generateActasTables(actas),

        { text: '\n Información Institucional', style: 'subheader' },
        this.generateParametrosTable(parametros),
      ],
      styles: {
        // Encabezado principal
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#2C3E50',
          margin: [0, 0, 0, 10],
        },

        // Subtítulos de secciones generales
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
          color: '#1E88E5',
          alignment: 'center'
        },

        // Nuevo: título principal de cada acta
        subheadertitulo: {
          fontSize: 13,
          bold: true,
          color: '#0B3D91', // azul institucional
          margin: [0, 8, 0, 4],
          decoration: 'underline',
          decorationColor: '#0B3D91',
        },

        // Encabezado general de tablas
        tableHeader: {
          bold: true,
          fontSize: 10,
          fillColor: '#f3f4f6',
          color: '#111827'
        },

        // Encabezado de bloque (Productos, Observaciones, etc.)
        sectionHeader: {
          bold: true,
          fontSize: 11,
          color: '#0f172a',
          fillColor: '#e0f2fe',
          margin: [0, 4, 0, 2],
        },

        // Variantes para encabezados
        tableHeaderGray: {
          fillColor: '#f3f4f6',
          color: '#374151',
          bold: true,
          fontSize: 10,
        },
        tableHeaderBlue: {
          fillColor: '#e0f2fe',
          color: '#0c4a6e',
          bold: true,
          fontSize: 10,
        },
        tableCell: {
          fontSize: 9,
        },
      },
      defaultStyle: {
        fontSize: 10,
        alignment: 'left',
      },
      pageMargins: [40, 60, 40, 40],
    };

    pdfMake.createPdf(docDefinition).open();
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
          widths: ['25%', '30%', '25%', '10%', '10%'],
          body: [
            [
              { text: 'Categoría', style: 'tableHeader' },
              { text: 'Producto', style: 'tableHeader' },
              { text: 'Descripción', style: 'tableHeader' },
              { text: 'Stock', style: 'tableHeader' },
              { text: 'Fecha Ingreso', style: 'tableHeader' },
            ],
            ...cat.productos.map((p: any) => [
              cat.nombre,
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
  // 🔹 SECCIÓN: Beneficiarios
  // =====================================
  private generateBeneficiariosTable(beneficiarios: any[]) {
    if (!beneficiarios.length) {
      return { text: 'No hay beneficiarios asociados.', italics: true };
    }

    return {
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
          ...beneficiarios.map((b: any) => [
            b.nombreCompleto,
            b.numDocumentoBeneficiario,
            b.esBeneficiarioActivo ? 'Activo' : 'Inactivo',
            b.fechaInicio || '-',
          ]),
        ],
      },
      layout: 'lightHorizontalLines',
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

}
