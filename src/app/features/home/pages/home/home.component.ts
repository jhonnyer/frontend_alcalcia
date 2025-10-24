import { Component, inject, OnInit } from '@angular/core';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { RouterLink } from '@angular/router';
import { ActasService } from '../../../../core/services/actas.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { NucleoService } from '../../../../core/services/nucleo.service';
import * as XLSX from 'xlsx';

import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { ReportesService } from '../../../../core/services/reportes.service';
import { PdfGeneradorDashboardService } from '../../../../shared/components/pdf/pdf-generador-dashboard.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardComponent } from '../../../projects/pages/dashboard-general/dashboard.component';
import { AlertService } from '../../../../core/services/alert.service';

type ReportKeys =
  | 'global'
  | 'productProject'
  | 'beneficiarios'
  | 'categorias'
  | 'responsables'
  | 'nucleos'
  | 'actas'
  | 'productos';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink, 
    HasRoleDirective,
    CommonModule,
    MatMenuModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    DashboardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  private pageTitleService = inject(PageTitleService);
  private actasService = inject(ActasService);
  private beneficiaryService = inject(BeneficiaryService);
  private categoriasService = inject(CategoriasService);
  private responsibleService = inject(ResponsibleService);
  private productosService = inject(ProductosService);
  private nucleoService = inject(NucleoService);
  private reportes = inject(ReportesService);
  private pdfDashboard = inject(PdfGeneradorDashboardService);
  private alert = inject(AlertService);

  isLoadingPDF = false;
  nucleoId = 1;     // ejemplo: luego puedes asignar dinámicamente
  proyectoId = 1;   // idem
  // 🔹 Nuevo objeto para controlar el estado de cada botón
  isLoadingReport: Record<ReportKeys, boolean> = {
    global: false,
    productProject: false,
    beneficiarios: false,
    categorias: false,
    responsables: false,
    nucleos: false,
    actas: false,
    productos: false
  };

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('SISTEMA INTEGRAL DE PROYECTOS Y DONACIONES MUNICIPALES');
  }

  private getFormattedDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Retorna YYYY-MM-DD
  }

  downloadGlobalReport() {
    this.isLoadingReport.global = true;
    this.actasService.getExcelActas().subscribe({
      next: (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);

        // Crear elemento a temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = `Informe global ${this.getFormattedDate()}.xlsx`;

        // Simular click para descargar
        document.body.appendChild(link);
        link.click();

        // Limpieza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isLoadingReport.global = false;
      },
      error: error => {
        this.isLoadingReport.global = false;
        console.error('Error al descargar el Excel:', error);
        this.alert.error('Operacion fallida','Error al descargar el archivo Excel');
      }
    });
  }

  downloadProductProjectReport() {
    this.isLoadingReport.productProject = true;
    this.actasService.getExcelProductosProyecto().subscribe({
      next: (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);

        // Crear elemento a temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = `Informe productos por proyecto ${this.getFormattedDate()}.xlsx`;

        // Simular click para descargar
        document.body.appendChild(link);
        link.click();

        // Limpieza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isLoadingReport.productProject = false;  
      },
      error: error => {
        this.isLoadingReport.productProject = false;
        console.error('Error al descargar el Excel:', error);
        this.alert.error('Operación fallida','Error al descargar el archivo Excel');
      }
    });
  }

  downloadBeneficiarios() {
    this.isLoadingReport.beneficiarios = true;
    this.beneficiaryService.getAll().subscribe({
      next: (beneficiarios) => {
        // Preparar los datos para el Excel
        const data = beneficiarios.map(b => ({
          'ID': b.idBeneficiario,
          'Primer Nombre': b.primerNombre,
          'Segundo Nombre': b.segundoNombre,
          'Primer Apellido': b.primerApellido,
          'Segundo Apellido': b.segundoApellido,
          'Sexo': b.sexo,
          'Género': b.genero,
          'Etnia': b.etnia,
          'Edad': b.edad,
          'Víctima Conflicto': b.victimaConflicto ? 'Sí' : 'No',
          'Tipo Documento': b.tipoDocumento,
          'Número Documento': b.numeroDocumento,
          'Fecha Nacimiento': b.fechaNacimiento,
          'Teléfono': b.telefono,
          'Email': b.email,
          'Estado': b.esVivo ? 'Vivo' : 'Fallecido',
          'ID Núcleo': b.nombreNucleo
        }));

        // Crear el libro de Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiarios');

        // Generar el archivo
        XLSX.writeFile(workbook, `Beneficiarios ${this.getFormattedDate()}.xlsx`);
        this.isLoadingReport.beneficiarios = false;
      },
      error: (error) => {
        this.isLoadingReport.beneficiarios = false;
        console.error('Error al obtener beneficiarios:', error);
        this.alert.error('Operación fallida','Error al descargar la información de beneficiarios');
      }
    });
  }

  downloadCategorias() {
    this.isLoadingReport.categorias = true;
    this.categoriasService.getAll().subscribe({
      next: (categorias) => {
        // Preparar los datos para el Excel con encabezados en español
        const data = categorias.map(cat => ({
          'ID': cat.idCategoria,
          'Nombre': cat.nombre,
          'Descripción': cat.descripcion
        }));

        // Crear el libro de Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorías');

        // Ajustar el ancho de las columnas
        const wscols = [
          { wch: 10 }, // ID
          { wch: 20 }, // Nombre
          { wch: 40 }  // Descripción
        ];
        worksheet['!cols'] = wscols;

        // Generar el archivo
        XLSX.writeFile(workbook, `Categorias ${this.getFormattedDate()}.xlsx`);
        this.isLoadingReport.categorias = false;
      },
      error: (error) => {
        this.isLoadingReport.categorias = false;
        console.error('Error al obtener categorías:', error);
        this.alert.error('Operación fallida','Error al descargar la información de categorías');
      }
    });
  }

  downloadActas() {
    this.isLoadingReport.actas = true;
    this.actasService.getAll().subscribe({
      next: (actas) => {
        // Preparar los datos para el Excel con formato más plano
        const data = actas.map(acta => ({
          'ID Acta': acta.idActa,
          'Fecha Creación': acta.fechaCreacion,
          'Estado': acta.estado,
          'Fecha Entrega': acta.fechaEntrega || '',
          // Datos del beneficiario
          'Beneficiario - Nombres': `${acta.beneficiario.primerNombre} ${acta.beneficiario.segundoNombre || ''}`,
          'Beneficiario - Apellidos': `${acta.beneficiario.primerApellido} ${acta.beneficiario.segundoApellido || ''}`,
          'Beneficiario - Documento': `${acta.beneficiario.tipoDocumento} ${acta.beneficiario.numeroDocumento}`,
          'Beneficiario - Teléfono': acta.beneficiario.telefono,
          'Beneficiario - Dirección': acta.beneficiario.direccionNucleo,
          'Beneficiario - Barrio': acta.beneficiario.barrio,
          'Beneficiario - Zona': acta.beneficiario.zona,
          // Datos del proyecto
          'Proyecto': acta.proyecto.nombre,
          // 'Tipo Proyecto': acta.proyecto.tipoProyecto,
          // Datos del responsable
          'Responsable': `${acta.responsable.primerNombre} ${acta.responsable.primerApellido}`,
          'Cargo Responsable': acta.responsable.cargo,
          'Área Responsable': acta.responsable.area,
          // Datos del acta
          'Ubicación Entrega': acta.ubicacionEntrega,
          'Prioridad': acta.prioridad,
          'Tipo Solicitud': acta.tipoSolicitud,
          'Responsable Visita': acta.responsableVisita,
          'Observaciones': acta.observaciones
        }));

        // Crear el libro de Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Actas');

        // Ajustar el ancho de las columnas
        const wscols = [
          { wch: 10 },  // ID
          { wch: 12 },  // Fecha Creación
          { wch: 10 },  // Estado
          { wch: 12 },  // Fecha Entrega
          { wch: 25 },  // Beneficiario Nombres
          { wch: 25 },  // Beneficiario Apellidos
          { wch: 20 },  // Documento
          { wch: 15 },  // Teléfono
          { wch: 30 },  // Dirección
          { wch: 20 },  // Barrio
          { wch: 15 },  // Zona
          { wch: 30 },  // Proyecto
          { wch: 15 },  // Tipo Proyecto
          { wch: 25 },  // Responsable
          { wch: 20 },  // Cargo
          { wch: 20 },  // Área
          { wch: 30 },  // Ubicación Entrega
          { wch: 10 },  // Prioridad
          // { wch: 20 },  // Tipo Solicitud
          { wch: 25 },  // Responsable Visita
          { wch: 40 },  // Observaciones
          { wch: 50 },  // Productos
          { wch: 50 }   // Paquetes
        ];
        worksheet['!cols'] = wscols;

        // Generar y descargar el archivo
        XLSX.writeFile(workbook, `Actas ${this.getFormattedDate()}.xlsx`);
        this.isLoadingReport.actas = false;
      },
      error: (error) => {
        this.isLoadingReport.actas = false;
        console.error('Error al obtener actas:', error);
        this.alert.error('Operación fallida','Error al descargar la información de actas');
      }
    });
  }

  downloadResponsables() {
    this.isLoadingReport.responsables = true;
    this.responsibleService.getAll().subscribe({
      next: (responsables) => {
        // Preparar los datos para el Excel
        const data = responsables.map(resp => ({
          'ID': resp.idResponsable,
          'Nombres': `${resp.primerNombre} ${resp.segundoNombre || ''}`.trim(),
          'Apellidos': `${resp.primerApellido} ${resp.segundoApellido || ''}`.trim(),
          'Cargo': resp.cargo,
          'Área': resp.area,
          'Teléfono': resp.telefono,
          'Email': resp.email,
          'Tipo Documento': resp.tipoIdentificacion,
          'Número Documento': resp.numeroIdentificacion,
          'Usuario': resp.usuario,
          'Perfil Usuario': resp.perfilUsuario,
          'Estado': resp.estado === 'A' ? 'Activo' : 'Inactivo'
        }));

        // Crear el libro de Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Responsables');

        // Ajustar el ancho de las columnas
        const wscols = [
          { wch: 8 },   // ID
          { wch: 25 },  // Nombres
          { wch: 25 },  // Apellidos
          { wch: 20 },  // Cargo
          { wch: 20 },  // Área
          { wch: 15 },  // Teléfono
          { wch: 30 },  // Email
          { wch: 15 },  // Tipo Documento
          { wch: 20 },  // Número Documento
          { wch: 15 },  // Usuario
          { wch: 15 },  // Perfil Usuario
          { wch: 10 }   // Estado
        ];
        worksheet['!cols'] = wscols;

        // Generar el archivo
        XLSX.writeFile(workbook, `Responsables ${this.getFormattedDate()}.xlsx`);
        this.isLoadingReport.responsables = false;
      },
      error: (error) => {
        this.isLoadingReport.responsables = false;
        console.error('Error al obtener responsables:', error);
        this.alert.error('Operación fallida','Error al descargar la información de responsables');
      }
    });
  }

  downloadProductos() {
    this.isLoadingReport.productos = true;
    this.productosService.getAll().subscribe({
      next: (productos) => {
        // Preparar los datos para el Excel
        const data = productos.map(prod => ({
          'ID': prod.idProducto,
          'Nombre': prod.nombre,
          'Descripción': prod.descripcion,
          'Stock': prod.stock,
          'Fecha Ingreso': prod.fechaIngreso || 'No registrada'
        }));

        // Crear el libro de Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

        // Ajustar el ancho de las columnas
        const wscols = [
          { wch: 8 },   // ID
          { wch: 30 },  // Nombre
          { wch: 40 },  // Descripción
          { wch: 10 },  // Stock
          { wch: 20 }   // Fecha Ingreso
        ];
        worksheet['!cols'] = wscols;

        // Generar el archivo
        XLSX.writeFile(workbook, `Productos ${this.getFormattedDate()}.xlsx`);
        this.isLoadingReport.productos = false;
      },
      error: (error) => {
        this.isLoadingReport.productos = false;
        console.error('Error al obtener productos:', error);
        this.alert.error('Operación fallida','Error al descargar la información de productos');
      }
    });
  }

  downloadNucleos() {
    this.isLoadingReport.nucleos = true;
    this.nucleoService.getSimpleAll().subscribe({
      next: (nucleos) => {
        // Preparar los datos
        const data = nucleos.map(nucleo => {
          const beneficiariosInfo = nucleo.beneficiarios && nucleo.beneficiarios.length > 0
            ? nucleo.beneficiarios.map(b =>
                `${b.primerNombre} ${b.segundoNombre || ''} ${b.primerApellido} ${b.segundoApellido || ''} (${b.tipoDocumento}: ${b.numeroDocumento})`
              ).join('\n')
            : 'Sin beneficiarios registrados';

          return {
            'ID Núcleo': nucleo.idNucleo,
            'Nombre Núcleo': nucleo.nombreNucleo,
            'Dirección': nucleo.direccion,
            'Número de Integrantes': nucleo.numeroIntegrantes,
            'ID Zona': nucleo.idZonaFk,
            'ID Barrio': nucleo.idBarrioFk,
            'Beneficiarios': beneficiariosInfo
          };
        });

        // Crear la hoja
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Núcleos Familiares');

        // Ajustar el ancho de las columnas
        const wscols = [
          { wch: 10 },  // ID Núcleo
          { wch: 20 },  // Nombre Núcleo
          { wch: 35 },  // Dirección
          { wch: 15 },  // Número de Integrantes
          { wch: 10 },  // ID Zona
          { wch: 10 },  // ID Barrio
          { wch: 60 }   // Beneficiarios
        ];
        worksheet['!cols'] = wscols;

        // Ajustar altura de filas
        const wsrows = data.map(() => ({ hpt: 40 })); // altura en puntos
        worksheet['!rows'] = wsrows;

        // Generar el archivo
        XLSX.writeFile(workbook, `NucleosFamiliares ${this.getFormattedDate()}.xlsx`);
        this.isLoadingReport.nucleos = false;
      },
      error: (error) => {
        this.isLoadingReport.nucleos = false;
        console.error('Error al obtener núcleos familiares:', error);
        this.alert.error('Operación fallida','Error al descargar la información de núcleos familiares');
      }
    });
  }

  descargarReporte() {
    this.isLoadingPDF = true;
    this.reportes.obtenerDashboard().subscribe(d => {
          this.pdfDashboard.generateDashboardReport(d);
          this.isLoadingPDF = false;
        });
  }

}
