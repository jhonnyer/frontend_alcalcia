import { Component, inject, OnInit } from '@angular/core';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ActasService } from '../../../../core/services/actas.service';
import { RouterLink } from '@angular/router';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  private pageTitleService = inject(PageTitleService);
  private actasService = inject(ActasService);
  private beneficiaryService = inject(BeneficiaryService);
  private categoriasService = inject(CategoriasService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Home');
  }

  downloadExcel() {
    this.actasService.getExcelActas().subscribe({
      next: (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);

        // Crear elemento a temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Actas.xlsx';

        // Simular click para descargar
        document.body.appendChild(link);
        link.click();

        // Limpieza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: error => {
        console.error('Error al descargar el Excel:', error);
        alert('Error al descargar el archivo Excel');
      }
    });
  }

  downloadBeneficiarios() {
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
          'ID Núcleo': b.idNucleoFk
        }));

        // Crear el libro de Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiarios');

        // Generar el archivo
        XLSX.writeFile(workbook, 'Beneficiarios.xlsx');
      },
      error: (error) => {
        console.error('Error al obtener beneficiarios:', error);
        alert('Error al descargar la información de beneficiarios');
      }
    });
  }

  downloadCategorias() {
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
        XLSX.writeFile(workbook, 'Categorias.xlsx');
      },
      error: (error) => {
        console.error('Error al obtener categorías:', error);
        alert('Error al descargar la información de categorías');
      }
    });
  }
}
