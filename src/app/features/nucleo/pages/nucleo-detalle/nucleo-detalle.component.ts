import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { NucleoDetallado } from '../../../../core/models/nucleo-detallado.model';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion'; 
import { FilterBeneficiarioPipe } from '../../../../shared/components/pipe/filterBeneficiario.pipe';
import { FilterActaEstadoPipe } from '../../../../shared/components/pipe/filterActaEstado.pipe';
import { FormsModule } from '@angular/forms';
import { PdfGeneradorNucleoService } from '../../../../shared/components/pdf/pdf-generador-nucleo.service';

@Component({
  selector: 'app-nucleo-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatIconModule,
    MatExpansionModule,
    FilterBeneficiarioPipe,
    FilterActaEstadoPipe,
    FormsModule
],
  templateUrl: './nucleo-detalle.component.html',
  styleUrl: './nucleo-detalle.component.scss' 
})
export class NucleoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private nucleoService = inject(NucleoService);
  private pdfService = inject(PdfGeneradorNucleoService);
  private router = inject(Router);
  filtroBeneficiario = '';
  filtroEstado = '';

  detalle?: NucleoDetallado;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.nucleoService.obtenerDetalleNucleo(id).subscribe({
      next: (data) => {
        this.detalle = data.respuesta;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando núcleo', err);
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(["nucleo"]);
  }

  traducirEstado(codigo: string): string {
    const mapa: any = {
      P: 'Pendiente',
      R: 'Recibido',
      RC: 'Rechazado',
      A: 'Autorizado',
      E: 'Entregado'
    };
    return mapa[codigo] || codigo;
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      P: 'bg-amber-100 text-amber-700 border-amber-200',
      R: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      A: 'bg-blue-100 text-blue-700 border-blue-200',
      RC: 'bg-red-100 text-red-700 border-red-200',
      E: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colores[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  }

  clearBeneficiarioFilter(): void {
    this.filtroBeneficiario = '';
  }

  clearEstadoFilter(): void {
    this.filtroEstado = '';
  }

  get proyectosActivos(): number {
    return this.detalle?.beneficiariosProyecto?.filter(bp => bp.esBeneficiarioActivo).length ?? 0;
  }

  get actasCount(): number {
    return this.detalle?.actas?.length ?? 0;
  }

  exportarPdf(): void {
    if (this.detalle) {
      this.pdfService.generateNucleoReport(this.detalle);
    }
  }
}
