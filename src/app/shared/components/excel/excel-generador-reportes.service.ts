import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

interface ResumenProyecto {
  Proyecto: string;
  Activos: number;
  Inactivos: number;
  TotalEntregas: number;
  Total?: number;
}

@Injectable({ providedIn: 'root' })
export class ExcelGeneradorReportesService {
    
  /**
   * Genera el Excel completo con todas las hojas institucionales
   */
  generarExcelIntegral(
    dashboardData: any[],
    actasData: any[],
    nucleosData: any[],
    productosData: any[],
    proyectosData: any[]
  ): void {
    const wb = XLSX.utils.book_new();

    this.hojaResumenGeneral(wb, dashboardData, actasData);
    this.hojaDetalleBeneficiarios(wb, dashboardData, nucleosData);
    this.hojaProductosPorBeneficiario(wb, actasData);
    this.hojaDistribucionTerritorial(wb, dashboardData, nucleosData);
    this.hojaResumenPorBeneficiario(wb, dashboardData);
    this.hojaEntregasActas(wb, actasData);
    this.hojaProductosPorActa(wb, actasData);
    this.hojaCatalogoProductos(wb, productosData, proyectosData);

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Reporte_Integral_Municipal_${fecha}.xlsx`);
  }

    // ==========================================================
    // 1. RESUMEN GENERAL (por Proyecto)
    // ==========================================================
    private hojaResumenGeneral(wb: XLSX.WorkBook, dashboard: any[], actas: any[]): void {
        // Estructura acumulada por proyecto
        const resumenMap = dashboard.reduce<Record<string, ResumenProyecto>>((acc, b) => {
            const key = b.nombreProyecto || 'Proyecto sin nombre';
            if (!acc[key]) {
            acc[key] = { Proyecto: key, Activos: 0, Inactivos: 0, TotalEntregas: 0 };
            }
            if (b.esBeneficiarioActivo) acc[key].Activos++;
            else acc[key].Inactivos++;
            return acc;
        }, {});

        // Actualizar Totales de entregas usando las actas
        actas.forEach(a => {
            const proyecto = a.proyecto?.nombre || 'Proyecto sin nombre';
            const item = resumenMap[proyecto];
            if (item) item.TotalEntregas++;
        });

        // Convertir a arreglo para el Excel
        const resumen: ResumenProyecto[] = Object.values(resumenMap);

        // Calcular total de beneficiarios por proyecto
        resumen.forEach(r => (r.Total = r.Activos + r.Inactivos));

        // Mapear con nombres más claros para las columnas del Excel
        const dataExcel = resumen.map(r => ({
            'Proyecto': r.Proyecto,
            'Benef. Activos': r.Activos,
            'Benef. Inactivos': r.Inactivos,
            'Total Beneficiarios': r.Total,
            'Actas Entregadas': r.TotalEntregas
        }));

        // Crear hoja de Excel
        const ws = XLSX.utils.json_to_sheet(dataExcel);
        XLSX.utils.book_append_sheet(wb, ws, 'Resumen General');

        // Ancho de columnas más equilibrado
        ws['!cols'] = [
            { wch: 35 }, // Proyecto
            { wch: 18 }, // Benef. Activos
            { wch: 18 }, // Benef. Inactivos
            { wch: 22 }, // Total Beneficiarios
            { wch: 20 } // Actas Entregadas
        ];
    }


  // ==========================================================
  // 2. DETALLE DE BENEFICIARIOS POR PROYECTO
  // ==========================================================
  private hojaDetalleBeneficiarios(wb: XLSX.WorkBook, dashboard: any[], nucleos: any[]): void {
    const data = dashboard.map(b => {
      const nucleo = nucleos.find(n => n.nombreNucleo === b.nombreNucleo);
      return {
        Proyecto: b.nombreProyecto,
        EstadoProyecto: b.estadoProyecto === 'A' ? 'Activo' : 'Inactivo',
        Beneficiario: b.nombreCompleto,
        Documento: b.numDocumentoBeneficiario,
        Edad: b.edadBeneficiario,
        ActorSocial: b.nombreNucleo,
        Zona: nucleo?.nombreZona || '—',
        Barrio: b.nombreBarrio,
        Integrantes: nucleo?.numeroIntegrantes || '—',
        Activo: b.esBeneficiarioActivo ? 'Sí' : 'No',
        FechaInicio: b.fechaInicio,
        FechaFin: b.fechaFin || '—',
        Observaciones: b.observaciones || '—'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Beneficiarios x Proyecto');
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 8 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
    ];
  }


    // ==========================================================
    // 3. PRODUCTOS ENTREGADOS POR BENEFICIARIO
    // ==========================================================
  private hojaProductosPorBeneficiario(wb: XLSX.WorkBook, actas: any[]): void {
    const data: any[] = [];

    actas.forEach(a => {
        const detalles = a.detallesActaProductos || a.detalleActaProductos || [];

        if (Array.isArray(detalles) && detalles.length > 0) {
        detalles.forEach((d: any) => {
            // Producto individual
            if (d.productos) {
            data.push({
                'Proyecto': a.proyecto?.nombre || '—',
                'Beneficiario': `${a.beneficiario?.primerNombre ?? ''} ${a.beneficiario?.primerApellido ?? ''}`.trim(),
                'Documento': a.beneficiario?.numeroDocumento || '—',
                'Tipo Entrega': 'Producto',
                'Nombre Entrega': d.productos.nombreProducto || '—',
                'Descripción': d.productos.descripcion || '—',
                'Cantidad Entregada': d.productos.cantidad ?? d.cantidad ?? 0,
                'Fecha Entrega': a.fechaEntrega || a.fechaCreacion || '—',
                'Responsable': `${a.responsable?.primerNombre ?? ''} ${a.responsable?.primerApellido ?? ''}`.trim(),
                'Observaciones': a.observaciones || '—'
            });
            }

            // Paquete entregado
            if (d.paquetes) {
            data.push({
                'Proyecto': a.proyecto?.nombre || '—',
                'Beneficiario': `${a.beneficiario?.primerNombre ?? ''} ${a.beneficiario?.primerApellido ?? ''}`.trim(),
                'Documento': a.beneficiario?.numeroDocumento || '—',
                'Tipo Entrega': 'Paquete',
                'Nombre Entrega': d.paquetes.nombrePaquete || '—',
                'Descripción': d.paquetes.descripcion || '—',
                'Cantidad Entregada': d.paquetes.cantidad ?? d.cantidad ?? 0,
                'Fecha Entrega': a.fechaEntrega || a.fechaCreacion || '—',
                'Responsable': `${a.responsable?.primerNombre ?? ''} ${a.responsable?.primerApellido ?? ''}`.trim(),
                'Observaciones': a.observaciones || '—'
            });
            }
        });
        }
    });

    // Si no hay datos, agregar fila informativa
    if (data.length === 0) {
        data.push({
        'Proyecto': '—',
        'Beneficiario': '—',
        'Documento': '—',
        'Tipo Entrega': '—',
        'Nombre Entrega': 'Sin datos de entregas en las actas',
        'Descripción': '—',
        'Cantidad Entregada': '—',
        'Fecha Entrega': '—',
        'Responsable': '—',
        'Observaciones': '—'
        });
    }

    // Crear hoja Excel
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Productos x Beneficiario');

    ws['!cols'] = [
        { wch: 25 }, // Proyecto
        { wch: 28 }, // Beneficiario
        { wch: 18 }, // Documento
        { wch: 15 }, // Tipo Entrega
        { wch: 30 }, // Nombre Entrega
        { wch: 35 }, // Descripción
        { wch: 15 }, // Cantidad
        { wch: 15 }, // Fecha Entrega
        { wch: 25 }, // Responsable
        { wch: 35 }  // Observaciones
    ];
    }

    // ==========================================================
    // DISTRIBUCIÓN TERRITORIAL (Zonas y Barrios)
    // ==========================================================
    private hojaDistribucionTerritorial(wb: XLSX.WorkBook, dashboard: any[], nucleos: any[]): void {
        const agrupado = Object.values(
            dashboard.reduce((acc: any, b: any) => {
            // Buscar la zona en el listado de núcleos si no está directamente en el dashboard
            const nucleo = nucleos.find(n => n.nombreNucleo === b.nombreNucleo);
            const zona = nucleo?.nombreZona || b.nombreZona || '—';
            const barrio = b.nombreBarrio || nucleo?.nombreBarrio || '—';
            const key = `${zona}-${barrio}`;

            if (!acc[key]) {
                acc[key] = {
                'Zona': zona,
                'Barrio': barrio,
                'Total Beneficiarios': 0,
                'Benef. Activos': 0,
                'Benef. Inactivos': 0
                };
            }

            acc[key]['Total Beneficiarios']++;
            if (b.esBeneficiarioActivo) acc[key]['Benef. Activos']++;
            else acc[key]['Benef. Inactivos']++;

            return acc;
            }, {})
        );

        const ws = XLSX.utils.json_to_sheet(agrupado);
        XLSX.utils.book_append_sheet(wb, ws, 'Distribución Territorial');

        ws['!cols'] = [
            { wch: 35 }, // Zona
            { wch: 25 }, // Barrio
            { wch: 20 }, // Total
            { wch: 20 }, // Activos
            { wch: 20 }  // Inactivos
    ];
    }



    // ==========================================================
    // RESUMEN POR BENEFICIARIO
    // ==========================================================
    private hojaResumenPorBeneficiario(wb: XLSX.WorkBook, dashboard: any[]): void {
        const resumen = Object.values(
            dashboard.reduce((acc: any, b: any) => {
            const documento = b.numDocumentoBeneficiario || b.beneficiario?.numeroDocumento;
            const nombre = b.nombreCompleto || `${b.beneficiario?.primerNombre ?? ''} ${b.beneficiario?.primerApellido ?? ''}`.trim();

            if (!documento) return acc;

            if (!acc[documento]) {
                acc[documento] = {
                'Beneficiario': nombre,
                'Documento': documento,
                'Proyectos': new Set<string>(),
                'Proyectos Activos': 0,
                'Proyectos Finalizados': 0,
                'Último Proyecto': '',
                'Última Fecha Fin': '',
                'Observaciones': '',
                'Estado Actual': 'Inactivo'
                };
            }

            // Registrar proyecto
            acc[documento]['Proyectos'].add(b.nombreProyecto || b.proyecto?.nombre);

            // Contar activos/inactivos
            if (b.esBeneficiarioActivo) acc[documento]['Proyectos Activos']++;
            else acc[documento]['Proyectos Finalizados']++;

            // Determinar si está activo actualmente
            if (b.esBeneficiarioActivo) acc[documento]['Estado Actual'] = 'Activo';

            // Guardar el último proyecto (por fecha más reciente)
            const fechaFinActual = acc[documento]['Última Fecha Fin'];
            const fechaFinNueva = b.fechaFin || b.fechaInicio;

            if (!fechaFinActual || (fechaFinNueva && fechaFinNueva > fechaFinActual)) {
                acc[documento]['Último Proyecto'] = b.nombreProyecto || b.proyecto?.nombre;
                acc[documento]['Última Fecha Fin'] = fechaFinNueva || '—';
                acc[documento]['Observaciones'] = b.observaciones || '—';
            }

            return acc;
            }, {})
        ).map((b: any) => ({
            'Beneficiario': b['Beneficiario'],
            'Documento': b['Documento'],
            'Total Proyectos': b['Proyectos'].size,
            'Proyectos Activos': b['Proyectos Activos'],
            'Proyectos Finalizados': b['Proyectos Finalizados'],
            'Último Proyecto': b['Último Proyecto'],
            'Estado Actual': b['Estado Actual'],
            'Última Fecha Fin': b['Última Fecha Fin'],
            'Observaciones': b['Observaciones']
        }));

        const ws = XLSX.utils.json_to_sheet(resumen);
        XLSX.utils.book_append_sheet(wb, ws, 'Resumen x Beneficiario');

        ws['!cols'] = [
            { wch: 30 }, // Beneficiario
            { wch: 18 }, // Documento
            { wch: 15 }, // Total Proyectos
            { wch: 18 }, // Proyectos Activos
            { wch: 20 }, // Proyectos Finalizados
            { wch: 30 }, // Último Proyecto
            { wch: 15 }, // Estado Actual
            { wch: 18 }, // Última Fecha Fin
            { wch: 40 }  // Observaciones
    ];
    }


  // ==========================================================
  // ENTREGAS / ACTAS
  // ==========================================================
    private hojaEntregasActas(wb: XLSX.WorkBook, actas: any[]): void {
        const estadosMap: Record<string, string> = {
            'R': 'Recibido',
            'P': 'Procesado',
            'A': 'Autorizado',
            'E': 'Entregado',
            'RC': 'Rechazado'
        };

        const data = actas.map(a => ({
            'ID Acta': a.idActa,
            'Proyecto': a.proyecto?.nombre || '—',
            'Beneficiario': `${a.beneficiario?.primerNombre ?? ''} ${a.beneficiario?.primerApellido ?? ''}`.trim(),
            'Fecha Entrega': a.fechaEntrega || '—',
            'Estado': estadosMap[a.estado] || a.estado || '—',
            'Responsable': `${a.responsable?.primerNombre ?? ''} ${a.responsable?.primerApellido ?? ''}`.trim(),
            'Área Responsable': a.responsable?.area || '—',
            'Ubicación': a.ubicacionEntrega || '—',
            'Observaciones': a.observaciones || '—'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Actas y Entregas');
        
        ws['!cols'] = [
            { wch: 10 }, // ID Acta
            { wch: 25 }, // Proyecto
            { wch: 25 }, // Beneficiario
            { wch: 15 }, // Fecha Entrega
            { wch: 15 }, // Estado
            { wch: 25 }, // Responsable
            { wch: 20 }, // Área Responsable
            { wch: 25 }, // Ubicación
            { wch: 35 }  // Observaciones
        ];
    }


    // ==========================================================
    // PRODUCTOS ENTREGADOS POR ACTA
    // ==========================================================
    private hojaProductosPorActa(wb: XLSX.WorkBook, actas: any[]): void {
        const estadosMap: Record<string, string> = {
            'R': 'Recibido',
            'P': 'Procesado',
            'A': 'Autorizado',
            'E': 'Entregado',
            'RC': 'Rechazado'
        };

        const productosEntregados: any[] = [];

        actas.forEach(a => {
            a.detallesActaProductos?.forEach((d: any) => {
            const productoNombre =
                d.productos?.nombreProducto ||
                d.producto?.nombre ||
                d.nombreProducto ||
                d.paquetes?.nombrePaquete ||
                '—';

            const descripcion =
                d.productos?.descripcion ||
                d.paquetes?.descripcion ||
                d.descripcion ||
                '—';

            const cantidad =
                d.productos?.cantidad ||
                d.paquetes?.cantidad ||
                d.cantidad ||
                0;

            productosEntregados.push({
                'ID Acta': a.idActa,
                'Fecha Entrega': a.fechaEntrega || a.fechaCreacion || '—',
                'Proyecto': a.proyecto?.nombre || '—',
                'Estado Acta': estadosMap[a.estado] || a.estado || '—',
                'Beneficiario': `${a.beneficiario?.primerNombre ?? ''} ${a.beneficiario?.primerApellido ?? ''}`.trim(),
                'Documento Beneficiario': a.beneficiario?.numeroDocumento || '—',
                'Producto / Paquete': productoNombre,
                'Descripción': descripcion,
                'Cantidad Entregada': cantidad,
                'Responsable de Entrega': `${a.responsable?.primerNombre ?? ''} ${a.responsable?.primerApellido ?? ''}`.trim(),
                'Área / Secretaría': a.responsable?.area || '—',
                'Ubicación Entrega': a.ubicacionEntrega || '—',
                'Observaciones': a.observaciones || '—'
            });
            });
        });

        const ws = XLSX.utils.json_to_sheet(productosEntregados);
        XLSX.utils.book_append_sheet(wb, ws, 'Productos x Acta');

        ws['!cols'] = [
            { wch: 10 },  // ID Acta
            { wch: 15 },  // Fecha Entrega
            { wch: 25 },  // Proyecto
            { wch: 15 },  // Estado
            { wch: 25 },  // Beneficiario
            { wch: 20 },  // Documento
            { wch: 30 },  // Producto / Paquete
            { wch: 40 },  // Descripción
            { wch: 15 },  // Cantidad
            { wch: 25 },  // Responsable
            { wch: 25 },  // Área
            { wch: 25 },  // Ubicación
            { wch: 35 }   // Observaciones
        ];
    }

    // ==========================================================
    // CATÁLOGO DE PRODUCTOS (fusionado con proyectos)
    // ==========================================================
    private hojaCatalogoProductos(
        wb: XLSX.WorkBook,
        productos: any[],
        proyectos: any[]
        ): void {
        const productosEnriquecidos: any[] = [];

        // Recorremos todos los proyectos y categorías
        proyectos.forEach((p: any) => {
            const nombreProyecto = p.proyecto?.nombre || '—';

            p.categorias?.forEach((cat: any) => {
            const nombreCategoria = cat.nombre || '—';

            cat.productos?.forEach((prod: any) => {
                productosEnriquecidos.push({
                'ID Producto': prod.idProductoFk ?? prod.idProducto ?? '—',
                'Nombre': prod.nombreProducto || prod.nombre || '—',
                'Descripción': prod.descripcion || '—',
                'Stock': prod.stock ?? '—',
                'Fecha Ingreso': prod.fechaIngreso || '—',
                'Proyecto Asociado': nombreProyecto,
                'Categoría': nombreCategoria
                });
            });
            });
        });

        // Agregamos productos huérfanos (no presentes en proyectos)
        productos.forEach((p: any) => {
            const yaExiste = productosEnriquecidos.some(
            (pe) => pe['Nombre'] === p.nombre || pe['ID Producto'] === p.idProducto
            );
            if (!yaExiste) {
            productosEnriquecidos.push({
                'ID Producto': p.idProducto,
                'Nombre': p.nombre,
                'Descripción': p.descripcion,
                'Stock': p.stock,
                'Fecha Ingreso': p.fechaIngreso,
                'Proyecto Asociado': '—',
                'Categoría': '—'
            });
            }
        });

        const ws = XLSX.utils.json_to_sheet(productosEnriquecidos);
        XLSX.utils.book_append_sheet(wb, ws, 'Catálogo de Productos');

        ws['!cols'] = [
            { wch: 10 }, // ID Producto
            { wch: 25 }, // Nombre
            { wch: 40 }, // Descripción
            { wch: 10 }, // Stock
            { wch: 15 }, // Fecha Ingreso
            { wch: 30 },  // Proyecto Asociado
            { wch: 25 } // Categoría
        ];
    }

}
