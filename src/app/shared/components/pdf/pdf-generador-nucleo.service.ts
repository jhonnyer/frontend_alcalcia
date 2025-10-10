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

  generateNucleoReport(detalle: any) {
    const docDefinition: any = {
      content: [
        { text: '🏠 REPORTE DETALLADO DEL NÚCLEO FAMILIAR', style: 'header' },
        { text: '\n' },
        this.generateNucleoInfoTable(detalle),
        { text: '\n 👨 Beneficiarios del Núcleo', style: 'subheader' },
        this.generateBeneficiariosTable(detalle.beneficiariosNucleo || []),
        { text: '\n🎯 Beneficiarios con Proyectos', style: 'subheader' },
        this.generateProyectosTable(detalle.beneficiariosProyecto || []),
        { text: '\n🧾 Actas Asociadas', style: 'subheader' },
        ...this.generateActasTables(detalle.actas || []),
        { text: '\n🏛️ Información Institucional', style: 'subheader' },
        this.generateParametrosTable(detalle.parametros),
      ],
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center', color: '#2C3E50' },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#1E88E5' },
        tableHeader: { bold: true, fillColor: '#E0E0E0' },
      },
      defaultStyle: {
        fontSize: 10,
        alignment: 'left',
      },
      pageMargins: [40, 60, 40, 40],
    };

    pdfMake.createPdf(docDefinition).open();
  }

  // ==============================
  // Información general del núcleo
  // ==============================
  private generateNucleoInfoTable(detalle: any) {
    return {
      table: {
        widths: ['30%', '70%'],
        body: [
          ['Nombre del Núcleo:', detalle.nombreNucleo || '—'],
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
    console.log(beneficiarios)
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
            { text: 'Estado', style: 'tableHeader' },
            { text: 'Activo', style: 'tableHeader' },
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
  // Actas asociadas
  // ==============================
  private generateActasTables(actas: any[]) {
    if (!actas.length) {
      return [{ text: 'No hay actas asociadas.', italics: true }];
    }

    return actas.map(acta => {
      const estadoLegible = this.estadoActaLabels[acta.estado] || acta.estado;

      return {
        stack: [
          { text: `📄 Acta #${acta.idActa} (${estadoLegible})`, style: 'subheader' },
          {
            table: {
              widths: ['25%', '25%', '25%', '25%'],
              body: [
                ['Fecha Creación', 'Fecha Entrega', 'Responsable', 'Tipo Solicitud'],
                [
                  acta.fechaCreacion || '—',
                  acta.fechaEntrega || '—',
                  `${acta.responsable?.primerNombre ?? ''} ${acta.responsable?.primerApellido ?? ''}`,
                  acta.tipoSolicitud || '—',
                ]
              ]
            },
            layout: 'noBorders'
          },
          ...(acta.detallesActaProductos?.length
            ? [
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
                      )
                    ]
                  },
                  layout: 'lightHorizontalLines'
                }
              ]
            : [{ text: 'Sin productos registrados.', italics: true }]),
            // ==============================
            // Observaciones
            // ==============================
            {
              margin: [0, 6, 0, 0],
              stack: [
                {
                  text: 'Observaciones:',
                  bold: true,
                  color: '#374151', // gris oscuro elegante
                  margin: [0, 4, 0, 2],
                },
                {
                  text: acta.observaciones && acta.observaciones.trim() !== ''
                    ? acta.observaciones
                    : '— Sin observaciones —',
                  italics: true,
                  color: '#4b5563', // gris medio
                  margin: [0, 0, 0, 8],
                }
              ]
            },
          { text: '\n' }
        ]
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
