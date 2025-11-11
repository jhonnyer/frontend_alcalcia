import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;


@Injectable({ providedIn: 'root' })
export class PdfGeneradorDashboardService {

  private readonly estadoActaLabels: Record<string, string> = {
    P: 'Pendiente',
    RC: 'Rechazado',
    R: 'Recibido',
    A: 'Autorizado',
    E: 'Entregado'
  };

  async generateDashboardReport(data: any) {
    const logoUrl = '/img/alcaldiaAlmaguer.png';
    const logo = await this.getBase64ImageFromAssets(logoUrl);
    const docDefinition: any = {
      content: [
        this.encabezado(logo),

        { text: '\nResumen General', style: 'subheader' },
        this.tablaResumenGeneral(data.resumenGeneral),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nPoblación Vulnerable', style: 'subheader' },
        this.tablaPoblacionVulnerable(data.poblacionVulnerable),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nDistribución por Edad', style: 'subheader' },
        this.tablaDistribucionEdad(data.distribucionEdad),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nDistribución por Zona', style: 'subheader' },
        this.tablaZonas(data.porZona),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nDistribución por Barrios / Veredas', style: 'subheader' },
        this.tablaBarrios(data.porBarrio),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nBeneficiarios por Proyecto', style: 'subheader' },
        this.tablaBeneficiariosProyecto(data),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nProductos Entregados Globalmente', style: 'subheader' },
        this.tablaProductosEntregados(data.productosEntregados),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nActas por Mes y Estado', style: 'subheader' },
        this.tablaActasPorMes(data.actasPorMes),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nActas por Responsable', style: 'subheader' },
        this.tablaActasPorResponsable(data.actasPorResponsable),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nSolicitudes por Tipo', style: 'subheader' },
        this.tablaSolicitudesPorTipo(data.solicitudesPorTipo),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nEntregas por Proyecto', style: 'subheader' },
        this.tablaEntregasPorProyecto(data.entregasPorProyecto),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nDetalle de Entregas por Proyecto', style: 'subheader' },
        this.tablaEntregasDetallePorProyecto(data),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nActas por Estado y Proyecto', style: 'subheader' },
        this.tablaActasPorEstadoProyecto(data.actasPorEstadoProyecto),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nResumen por Estado de Proyecto', style: 'subheader' },
        this.tablaResumenEstadoProyecto(data.resumenEstadoProyeto),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },

        { text: '\nDetalle de Proyectos', style: 'subheader' },
        ...this.detalleProyectos(data.proyectosResumen),
        { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' } ], margin: [0, 10, 0, 10] },
        { text: '\n Información Institucional', style: 'subheader' },
        this.generateParametrosTable(data.parametros),
      ],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
            { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 8, margin: [0, 0, 40, 0], color: '#6b7280' },
            { text: '© Alcaldía de Almaguer', alignment: 'left', fontSize: 8, margin: [40, 0, 0, 0], color: '#6b7280' },
        ],
      }),
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#1E3A8A',
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          color: '#2563EB',
          margin: [0, 10, 0, 6],
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          fillColor: '#E5E7EB',
          color: '#111827',
        },
        sectionHeader: {
          bold: true,
          fontSize: 12,
          color: '#0f172a',
          fillColor: '#e0f2fe',
          margin: [0, 4, 0, 2],
        },
      },
      defaultStyle: { fontSize: 10 },
      pageMargins: [40, 100, 40, 60],
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


  // ======= SECCIONES GENERALES =======
  private tablaResumenGeneral(data: any) {
    if (!data) return { text: 'No hay información disponible.', italics: true };
    return {
      table: {
        widths: ['*', '*'],
        body: [
          [{ text: 'Total Beneficiarios', style: 'tableHeader' }, data.totalBeneficiarios],
          [{ text: 'Total Proyectos', style: 'tableHeader' }, data.totalProyectos],
          [{ text: 'Total Actas', style: 'tableHeader' }, data.totalActas],
          [{ text: 'Total Productos Entregados', style: 'tableHeader' }, data.totalProductosEntregados],
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
      }
    };
  }

  private tablaPoblacionVulnerable(pv: any) {
    if (!pv) return { text: 'Sin datos.', italics: true };
    return {
      table: {
        widths: ['*', '*'],
        body: [
          [{ text: 'Discapacidad', style: 'tableHeader' }, pv.discapacidad],
          [{ text: 'Víctimas de Conflicto', style: 'tableHeader' }, pv.victimas],
          [{ text: 'Menores de Edad', style: 'tableHeader' }, pv.menoresEdad],
          [{ text: 'Mujeres', style: 'tableHeader' }, pv.mujeres],
          [{ text: 'Población LGBTI', style: 'tableHeader' }, pv.lgbti],
          [{ text: 'Total de beneficiarios', style: 'tableHeader' }, pv.total],
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
      }
    };
  }

  private tablaDistribucionEdad(list: any[]) {
    if (!list?.length) return { text: 'No hay datos.', italics: true, color: '#6b7280' };

    // 🔹 Orden lógico de los rangos etarios
    const ordenRangos = [
        'Primera infancia', // 0–5
        'Infancia',         // 6–12
        'Adolescencia',     // 13–17
        'Joven',            // 18–28
        'Adulto',           // 29–59
        'Adulto mayor'      // 60+
    ];

    // 🔹 Ordenar la lista de acuerdo al orden lógico anterior
    const edadesOrdenadas = [...list].sort(
        (a, b) => ordenRangos.indexOf(a.rangoEdad) - ordenRangos.indexOf(b.rangoEdad)
    );

    // 🔹 Si deseas ordenar por cantidad (de mayor a menor), usa esto en cambio:
    // const edadesOrdenadas = [...list].sort((a, b) => (b.total || 0) - (a.total || 0));

    return {
        margin: [0, 5, 0, 10],
        table: {
        widths: ['*', 'auto'],
        body: [
            [
            { text: 'Rango de Edad', style: 'tableHeader', alignment: 'left' },
            { text: 'Total', style: 'tableHeader', alignment: 'right' }
            ],
            ...edadesOrdenadas.map(e => [
            { text: e.rangoEdad, alignment: 'left' },
            { text: (e.total ?? 0).toLocaleString('es-CO'), alignment: 'right' }
            ])
        ]
        },
        layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null),
        hLineColor: () => '#E5E7EB',
        vLineColor: () => '#E5E7EB'
        }
    };
 }


  private tablaZonas(list: any[]) {
    if (!list?.length) return { text: 'No hay datos de zonas.', italics: true };
    return {
      table: {
        widths: ['*', 'auto'],
        body: [
          [{ text: 'Zona', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' }],
          ...list.map(z => [z.zona, z.total])
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
        }
    };
  }

  private tablaBarrios(list: any[]) {
    if (!list?.length) return { text: 'No hay datos de barrios o veredas', italics: true };
    return {
      table: {
        widths: ['auto','*', 'auto'],
        body: [
          [
            { text: 'Zona', style: 'tableHeader' },
            { text: 'Barrio / Vereda', style: 'tableHeader' },
            { text: 'Total', style: 'tableHeader' }
          ],
          ...list.map(b => [b.zona, b.barrio, b.total])
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
        }
    };
  }

     // ============================
  // 🔹 Beneficiarios por Proyecto (busca en resumenEstadoProyeto)
  // ============================
  private tablaBeneficiariosProyecto(data: any) {
    const proyectosActivos = data?.resumenEstadoProyeto?.proyectosActivos || [];
    const proyectosInactivos = data?.resumenEstadoProyeto?.proyectosInactivos || [];
    const proyectos = [...proyectosActivos, ...proyectosInactivos];

    if (!proyectos?.length) {
      return { text: 'No hay proyectos disponibles.', italics: true };
    }

    const proyectosConBeneficiarios = proyectos.filter(
      (p: any) => p.beneficiarios && p.beneficiarios.length > 0
    );

    if (!proyectosConBeneficiarios.length) {
      return { text: 'No hay proyectos con beneficiarios registrados.', italics: true };
    }

    const cuerpo = proyectosConBeneficiarios.map((p: any) => {
      // 🔹 Usamos el valor real del backend
      const totalBeneficiarios = p.totalBeneficiarios ?? p.beneficiarios.length ?? 0;

      return [
        // 🔹 Encabezado del proyecto
        { text: `\n📁 ${p.nombre}`, bold: true, margin: [0, 6, 0, 4], color: '#1E3A8A' },

        // 🔹 Tabla de beneficiarios
        {
          table: {
            widths: ['19%', '15%', '7%', '15%','13%', '11%', '11%', '9%'],
            body: [
              [
                { text: 'Nombre', style: 'tableHeader' },
                { text: 'Documento', style: 'tableHeader' },
                { text: 'Sexo', style: 'tableHeader' },
                { text: 'Zona', style: 'tableHeader' },
                { text: 'Barrio / Vereda', style: 'tableHeader' },
                { text: 'Actor Social', style: 'tableHeader' },
                { text: 'Discapacidad', style: 'tableHeader' },
                { text: 'Víctima', style: 'tableHeader' },
              ],
              ...p.beneficiarios.map((b: any) => [
                b.nombreCompleto,
                `${b.tipoDocumento ?? ''} ${b.documento ?? ''}`,
                b.sexo ?? '—',
                b.zona ?? '—',
                b.barrio ?? '—',
                b.nombreNucleo ?? '—',
                b.discapacidad ? 'Sí' : 'No',
                b.victimaConflicto ? 'Sí' : 'No',
              ]),

              // 🔹 Fila resumen total beneficiarios (del backend)
              [
                { 
                  text: `TOTAL BENEFICIARIOS EN ESTE PROYECTO: ${totalBeneficiarios}`, 
                  colSpan: 8, 
                  bold: true, 
                  alignment: 'right', 
                  fillColor: '#E5E7EB' 
                },
                {}, {}, {}, {}, {}, {}, {}
              ]
            ]
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null),
            hLineColor: () => '#E5E7EB',
            vLineColor: () => '#E5E7EB'
          }
        }
      ];
    });

    return { stack: cuerpo.flat() };
  }

  private tablaProductosEntregados(list: any[]) {
    if (!list?.length) {
        return { text: 'Sin productos entregados registrados.', italics: true, color: '#6b7280' };
    }

    // 🔹 Ordenar de mayor a menor según totalEntregado
    const productosOrdenados = [...list].sort((a, b) => (b.totalEntregado || 0) - (a.totalEntregado || 0));

    return {
        margin: [0, 5, 0, 10],
        table: {
        widths: ['35%', '45%','20%'],
        body: [
            [
            { text: 'Producto', style: 'tableHeader', alignment: 'left' },
            { text: 'Descripcion', style: 'tableHeader', alignment: 'left' },
            { text: 'Total Entregado', style: 'tableHeader', alignment: 'right' }
            ],
            ...productosOrdenados.map(p => [
            { text: p.producto || '—', alignment: 'left' },
            { text: p.descripcion || '—', alignment: 'left' },
            { text: (p.totalEntregado ?? 0).toLocaleString('es-CO'), alignment: 'right' }
            ])
        ]
        },
        layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null),
        hLineColor: () => '#E5E7EB',
        vLineColor: () => '#E5E7EB'
        }
    };
  }

  private tablaActasPorMes(list: any[]) {
    if (!list?.length) return { text: 'Sin datos de actas por mes.', italics: true };
    return {
      table: {
        widths: ['auto', 'auto', '*', 'auto'],
        body: [
          [
            { text: 'Año', style: 'tableHeader' },
            { text: 'Mes', style: 'tableHeader' },
            { text: 'Estado', style: 'tableHeader' },
            { text: 'Total', style: 'tableHeader' }
          ],
          ...list.map(a => [a.anio, a.mes, this.estadoActaLabels[a.estado] || a.estado, a.total])
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
        }
    };
  }

  private tablaActasPorResponsable(list: any[]) {
    if (!list?.length) return { text: 'Sin responsables registrados.', italics: true };
    return {
      table: {
        widths: ['*', 'auto'],
        body: [
          [{ text: 'Responsable', style: 'tableHeader' }, { text: 'Total Actas', style: 'tableHeader' }],
          ...list.map(r => [r.responsable, r.totalActas])
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
        }
    };
  }

  private tablaSolicitudesPorTipo(list: any[]) {
    if (!list?.length) return { text: 'Sin solicitudes registradas.', italics: true };
    return {
      table: {
        widths: ['*', 'auto'],
        body: [
          [{ text: 'Tipo Solicitud', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' }],
          ...list.map(s => [s.tipoSolicitud, s.total])
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
        }
    };
  }

  // ============================
  // Entregas por Proyecto (con productos)
  // ============================
  private tablaEntregasPorProyecto(list: any[]) {
    if (!list?.length) {
        return { text: 'Sin registros de entregas por proyecto.', italics: true, color: '#6b7280' };
    }

    // 🔹 Ordenar proyectos de mayor a menor por totalEntregas
    const proyectosOrdenados = [...list].sort((a, b) => (b.totalEntregas || 0) - (a.totalEntregas || 0));

    const cuerpo = proyectosOrdenados.map(p => {
        // Ordenar productos dentro del proyecto (de mayor a menor)
        const productos = (p.productos || []).sort((a: any, b: any) => (b.cantidadTotal || 0) - (a.cantidadTotal || 0));

        return [
        // 🔹 Nombre del proyecto
        {
            text: `\n🚚 ${p.proyecto}`,
            bold: true,
            margin: [0, 6, 0, 3],
            color: '#1E3A8A'
        },

        // 🔹 Tabla de productos entregados
        {
            table: {
            widths: ['30%', '50%', '20%'],
            body: [
                [
                { text: 'Producto', style: 'tableHeader' },
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Cantidad Total', style: 'tableHeader' }
                ],
                ...(productos.length
                ? productos.map((prod: any) => [
                    prod.producto || prod.nombre || '—',
                    prod.producto || prod.descripcion || '—',
                    (prod.cantidadTotal ?? 0).toLocaleString('es-CO')
                    ])
                : [['— Sin productos registrados —', '']])
            ]
            },
            layout: {
            fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null),
            hLineColor: () => '#E5E7EB',
            vLineColor: () => '#E5E7EB'
            }
        },

        // 🔹 Total de actas (entregas) por proyecto
        {
            text: `Total de actas de entrega generadas: ${p.totalEntregas}`,
            italics: true,
            margin: [0, 3, 0, 10],
            color: '#374151',
            fontSize: 10
        }
        ];
    });

    return { stack: [...cuerpo.flat()] };
 }



  private tablaActasPorEstadoProyecto(list: any[]) {
    if (!list?.length) return { text: 'Sin actas por estado.', italics: true };
    return {
      table: {
        widths: ['40%', '30%', '30%'],
        body: [
          [{ text: 'Proyecto', style: 'tableHeader' },
           { text: 'Estado', style: 'tableHeader' },
           { text: 'Total Actas', style: 'tableHeader' }],
          ...list.flatMap(p =>
            p.estados.map((e: any) => [
              p.proyecto,
              this.estadoActaLabels[e.estado] || e.estado,
              e.totalActas
            ])
          )
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
        }
    };
  }

  private tablaResumenEstadoProyecto(data: any) {
    if (!data) return { text: 'Sin información de estado de proyectos.', italics: true };
    return {
      table: {
        widths: ['*', '*'],
        body: [
          [{ text: 'Proyectos Activos', style: 'tableHeader' }, data.totalActivos],
          [{ text: 'Proyectos Inactivos', style: 'tableHeader' }, data.totalInactivos],
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
        }
    };
  }

    // ======= DETALLE DE PROYECTOS (mejorado con separación visual) =======
  private detalleProyectos(list: any[]) {
    if (!list?.length) return [{ text: 'Sin proyectos registrados.', italics: true }];

    // Ordenar activos primero
    const proyectosOrdenados = [...list].sort((a, b) => b.estado.localeCompare(a.estado));

    return proyectosOrdenados.map((p, index) => ({
      // 🔸 margen inferior para separar cada proyecto
      margin: [0, 0, 0, 18],
      stack: [
        // Encabezado del proyecto
        {
          text: `${p.nombre} (${p.estado === 'A' ? 'Activo' : 'Inactivo'})`,
          style: 'sectionHeader',
          margin: [0, 6, 0, 8],
          color: p.estado === 'A' ? '#065f46' : '#7c2d12', // verde o rojo
          decoration: 'underline'
        },

        // Tabla de resumen
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'Fecha Inicio', style: 'tableHeader' },
                { text: 'Fecha Fin', style: 'tableHeader' },
                { text: 'Duración (días)', style: 'tableHeader' },
                { text: 'Actas', style: 'tableHeader' }
              ],
              [p.fechaInicio, p.fechaFin, p.duracionDias, p.totalActas]
            ]
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
          }
        },

        // Beneficiarios
        { text: '\nBeneficiarios', bold: true, margin: [0, 6, 0, 3] },
        ...(p.beneficiarios?.length
          ? [this.tablaBeneficiariosProyectoDetalle(p.beneficiarios)]
          : [{ text: 'No hay beneficiarios registrados.', italics: true, color: '#6b7280' }]),

        // Categorías y productos
        { text: '\nCategorías y Productos', bold: true, margin: [0, 8, 0, 4] },
        ...(p.categorias?.length
          ? p.categorias.map((c: any) => ({
              margin: [12, 0, 0, 10],
              stack: [
                { text: `• ${c.nombreCategoria}`, bold: true, color: '#1E3A8A', margin: [0, 2, 0, 2] },
                {
                  table: {
                    widths: ['35%', '35%', '15%', '15%'],
                    body: [
                      [
                        { text: 'Producto', style: 'tableHeader' },
                        { text: 'Descripcion', style: 'tableHeader' },
                        { text: 'Stock', style: 'tableHeader' },
                        { text: 'Fecha Ingreso', style: 'tableHeader' },
                      ],
                      ...(c.productos?.length
                        ? c.productos.map((p2: any) => [
                            p2.nombreProducto,
                            p2.descripcion,
                            p2.stock,
                            p2.fechaIngreso,
                          ])
                        : [['— Sin productos registrados —', '', '','']])
                    ]
                  },
                  layout: {
                    fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
                  }
                }
              ]
            }))
          : [{ text: 'No hay categorías asociadas.', italics: true, color: '#6b7280' }]),

        // 🔹 Línea divisoria entre proyectos (excepto el último)
        ...(index < proyectosOrdenados.length - 1
          ? [
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 10,
                    x2: 515,
                    y2: 10,
                    lineWidth: 1,
                    lineColor: '#E5E7EB'
                  }
                ],
                margin: [0, 10, 0, 0]
              }
            ]
          : [])
      ]
    }));
  }


  private tablaBeneficiariosProyectoDetalle(list: any[]) {
    return {
      table: {
        widths: ['25%', '15%', '10%', '15%', '15%', '10%', '10%'],
        body: [
          [
            { text: 'Nombre', style: 'tableHeader' },
            { text: 'Documento', style: 'tableHeader' },
            { text: 'Sexo', style: 'tableHeader' },
            { text: 'Barrio / Vereda', style: 'tableHeader' },
            { text: 'Actor Social', style: 'tableHeader' },
            { text: 'Discapacidad', style: 'tableHeader' },
            { text: 'Víctima', style: 'tableHeader' },
          ],
          ...list.map(b => [
            b.nombreCompleto,
            `${b.tipoDocumento} ${b.documento}`,
            b.sexo,
            b.barrio || '—',
            b.nombreNucleo || '—',
            b.discapacidad ? 'Sí' : 'No',
            b.victimaConflicto ? 'Sí' : 'No',
          ])
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
      }
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

  private tablaEntregasDetallePorProyecto(data: any) {
    const proyectos = data.entregasPorProyecto || [];
    const proyectosResumen = data.proyectosResumen || [];

    const filas: any[] = [];

    proyectosResumen.forEach((p: any) => {
      const entregas = proyectos.find((e: any) => e.proyecto === p.nombre);
      const productos = entregas?.productos || [];

      p.beneficiarios?.forEach((b: any) => {
        productos.forEach((prod: any) => {
          filas.push({
            proyecto: p.nombre,
            beneficiario: b.nombreCompleto,
            producto: prod.nombre || prod.producto || prod.nombreProducto || '—',
            descripcion: prod.descripcion || '—',
            cantidad: prod.cantidadTotal || prod.stock || 0,
            zona: b.zona || '—',
            barrio: b.barrio || '—'
          });
        });
      });
    });

    // 🔹 Ordenar alfabéticamente
    filas.sort((a, b) => {
      const p = a.proyecto.localeCompare(b.proyecto);
      return p !== 0 ? p : a.beneficiario.localeCompare(b.beneficiario);
    });

    if (!filas.length)
      return { text: 'No hay datos de entregas detalladas por proyecto.', italics: true };

    return {
      table: {
        widths: ['*', '*', '*', '*', 'auto', '*', '*'],
        body: [
          [
            { text: 'Proyecto', style: 'tableHeader' },
            { text: 'Beneficiario', style: 'tableHeader' },
            { text: 'Producto', style: 'tableHeader' },
            { text: 'Descripción', style: 'tableHeader' },
            { text: 'Cantidad', style: 'tableHeader' },
            { text: 'Zona', style: 'tableHeader' },
            { text: 'Barrio / Vereda', style: 'tableHeader' }
          ],
          ...filas.map(f => [
            f.proyecto,
            f.beneficiario,
            f.producto,
            f.descripcion,
            f.cantidad,
            f.zona,
            f.barrio
          ])
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#F9FAFB' : null)
      }
    };
  }


}
