import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { IBeneficiarioProyecto } from '../../../core/models/beneficiarioProyecto.model';

pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

@Injectable({ providedIn: 'root' })
export class PdfBeneficiariosProyectoService {

  async generarReporte(data: IBeneficiarioProyecto[]) {
    const logoUrl = '/img/alcaldiaAlmaguer.png'; // ruta al logo en assets
    const logo = await this.getBase64ImageFromAssets(logoUrl);

    const fecha = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // 🔹 Agrupar beneficiarios por proyecto
    const proyectosMap = new Map<string, IBeneficiarioProyecto[]>();
    data.forEach(b => {
      const nombreProyecto = b.nombreProyecto || 'Proyecto sin nombre';
      if (!proyectosMap.has(nombreProyecto)) proyectosMap.set(nombreProyecto, []);
      proyectosMap.get(nombreProyecto)!.push(b);
    });

    // 🔹 Construir secciones de tabla para cada proyecto
    const secciones = Array.from(proyectosMap.entries()).map(([proyecto, beneficiarios]) => {
    const activos = beneficiarios.filter(b => b.esBeneficiarioActivo).length;
    const inactivos = beneficiarios.length - activos;

    return {
        stack: [
        { text: `\n📁 ${proyecto}`, style: 'subheader', margin: [0, 10, 0, 4] },
        {
        text: 'Resumen de Beneficiarios',
        style: 'resumenTitulo',
        margin: [0, 4, 0, 4],
        },

        {
        columns: [
            {
            width: 'auto',
            text: `* Activos: ${activos}`,
            color: '#065f46',
            bold: true,
            margin: [0, 0, 20, 0],
            },
            {
            width: 'auto',
            text: `* Inactivos: ${inactivos}`,
            color: '#4b5563',
            bold: true,
            },
        ],
        columnGap: 15,
        margin: [0, 2, 0, 10],
        },
        {
            table: {
            widths: ['5%', '25%', '15%', '10%', '15%', '15%', '15%'],
            body: [
                [
                { text: '#', style: 'tableHeader' },
                { text: 'Nombre Completo', style: 'tableHeader' },
                { text: 'Documento', style: 'tableHeader' },
                { text: 'Estado', style: 'tableHeader' },
                { text: 'Núcleo Familiar', style: 'tableHeader' },
                { text: 'Barrio', style: 'tableHeader' },
                { text: 'Observaciones', style: 'tableHeader' },
                ],
                ...beneficiarios.map((b, i) => [
                i + 1,
                b.nombreCompleto || '—',
                b.numDocumentoBeneficiario || '—',
                b.esBeneficiarioActivo ? 'Activo' : 'Inactivo',
                b.nombreNucleo || '—',
                b.nombreBarrio || '—',
                b.observaciones || '—'
                ])
            ]
            },
            layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#E5E7EB' : rowIndex % 2 === 0 ? '#F9FAFB' : null),
            hLineColor: () => '#E5E7EB',
            vLineColor: () => '#E5E7EB',
            },
            fontSize: 9,
        }
        ]
    };
    });


    // 🔹 Documento principal
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 110, 40, 60],
      content: [
        this.encabezado(logo),
        { text: 'REPORTE DE BENEFICIARIOS POR PROYECTO', style: 'header', margin: [0, 0, 0, 10] },
        { text: `Generado el ${fecha}`, style: 'fecha', margin: [0, 0, 0, 20] },
        ...secciones,
      ],
      footer: (currentPage: number, pageCount: number) => ({
        margin: [40, 10, 40, 0],
        columns: [
          { text: '© Alcaldía Municipal de Almaguer - Departamento del Cauca', alignment: 'left', fontSize: 8, color: '#6b7280' },
          { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 8, color: '#6b7280' }
        ]
      }),
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
        resumenTitulo: {
            fontSize: 11,
            bold: true,
            color: '#1E3A8A',
            alignment: 'left',
        },
        resumenProyecto: {
            fontSize: 10,
            italics: true,
            color: '#374151',
            alignment: 'left',
        },
      },
      defaultStyle: {
        fontSize: 9,
        color: '#111827'
      }
    };

    pdfMake.createPdf(docDefinition).open();
  }

  // 🔹 Encabezado institucional
  private encabezado(logo: string) {
    return {
      margin: [0, 0, 0, 20],
      columns: [
        {
          width: '70%',
          stack: [
            { text: 'ALCALDÍA MUNICIPAL DE ALMAGUER', bold: true, fontSize: 14, color: '#1E3A8A' },
            { text: 'Departamento del Cauca - República de Colombia', fontSize: 10, color: '#374151' },
            { text: 'Reporte Institucional de Proyectos y Beneficiarios', fontSize: 10, color: '#2563EB', margin: [0, 4, 0, 0] }
          ],
          alignment: 'left'
        },
        {
          width: '30%',
          image: logo,
          fit: [70, 70],
          alignment: 'right'
        }
      ]
    };
  }

  // 🔹 Convertir logo a Base64
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
