import { Component, inject, OnInit } from '@angular/core';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ActasService } from '../../../../core/services/actas.service';
import { RouterLink } from '@angular/router';

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
}
