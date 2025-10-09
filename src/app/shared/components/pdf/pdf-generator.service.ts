import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// asignar las fuentes (usa el namespace correcto)
(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {

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
        { text: '📘 REPORTE DETALLADO DEL PROYECTO', style: 'header' },
        { text: '\n' },
        this.generateProjectInfoTable(proyecto),

        { text: '\n📂 Categorías y Productos', style: 'subheader' },
        ...this.generateCategoryTables(categorias),

        { text: '\n👥 Beneficiarios del Proyecto', style: 'subheader' },
        this.generateBeneficiariosTable(beneficiarios),

        { text: '\n📑 Actas Asociadas', style: 'subheader' },
        ...this.generateActasTables(actas),

        { text: '\n🏛️ Información Institucional', style: 'subheader' },
        this.generateParametrosTable(parametros),
      ],
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center', color: '#2C3E50' },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#1E88E5' },
        projectInfo: { fontSize: 10, margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fillColor: '#E0E0E0' },
        tableCell: { fontSize: 9 },
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
  // 🔹 SECCIÓN: Información del proyecto
  // =====================================
  private generateProjectInfoTable(proyecto: any) {
    return {
      style: 'projectInfo',
      table: {
        widths: ['30%', '70%'],
        body: [
          ['Nombre del Proyecto:', proyecto.nombre],
          ['Descripción:', proyecto.descripcion || 'Sin descripción'],
          ['Tipo de Proyecto:', proyecto.tipoProyecto === 'M' ? 'Municipal' : 'Departamental'],
          ['Estado:', proyecto.estado === 'A' ? 'Activo' : 'Inactivo'],
          ['Fecha Inicio:', proyecto.fechaInicio || '-'],
          ['Fecha Fin:', proyecto.fechaFin || '-'],
        ],
      },
      layout: 'noBorders',
    };
  }

  // =====================================
  // 🔹 SECCIÓN: Categorías y productos
  // =====================================
  private generateCategoryTables(categorias: any[]) {
    const sections: any[] = [];

    categorias.forEach((cat) => {
      sections.push({ text: `🔹 ${cat.nombre}`, style: 'subheader' });
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

  // =====================================
  // 🔹 SECCIÓN: Actas y productos entregados
  // =====================================
  private generateActasTables(actas: any[]) {
    if (!actas.length) {
      return [{ text: 'No hay actas asociadas.', italics: true }];
    }

    return actas.map((acta) => {
      // Traducción del estado usando el “enum”
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
                  acta.fechaCreacion,
                  acta.fechaEntrega || '—',
                  `${acta.responsable?.primerNombre ?? ''} ${acta.responsable?.primerApellido ?? ''}`,
                  acta.tipoSolicitud || '—',
                ],
              ],
            },
            layout: 'noBorders',
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
                      ),
                    ],
                  },
                  layout: 'lightHorizontalLines',
                },
              ]
            : [{ text: 'Sin productos registrados.', italics: true }]),
          { text: '\n' },
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
