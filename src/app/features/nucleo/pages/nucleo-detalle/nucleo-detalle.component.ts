import { Component, HostListener, OnInit, inject } from '@angular/core';
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

type NucleoDetalleTab = 'resumen' | 'beneficiarios' | 'proyectos' | 'actas';

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
  activeTab: NucleoDetalleTab = 'resumen';
  isMobileView = false;
  beneficiariosPage = 1;
  beneficiariosPageSize = 5;
  proyectosPage = 1;
  proyectosPageSize = 5;

  detalle?: NucleoDetallado;
  loading = true;
  loadingPdf = false;

  ngOnInit(): void {
    this.updateViewportMode();
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportMode();
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
    this.beneficiariosPage = 1;
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

  get beneficiariosCount(): number {
    return this.detalle?.beneficiariosNucleo?.length ?? 0;
  }

  get beneficiariosVivosCount(): number {
    return this.detalle?.beneficiariosNucleo?.filter(b => b.esVivo).length ?? 0;
  }

  get beneficiariosDiscapacidadCount(): number {
    return this.detalle?.beneficiariosNucleo?.filter(b => b.discapacidad).length ?? 0;
  }

  get beneficiariosVictimaCount(): number {
    return this.detalle?.beneficiariosNucleo?.filter(b => b.victimaConflicto).length ?? 0;
  }

  get beneficiariosGeneroFCount(): number {
    return this.detalle?.beneficiariosNucleo?.filter(b => (b.genero ?? '').toLowerCase().startsWith('f')).length ?? 0;
  }

  get beneficiariosGeneroMCount(): number {
    return this.detalle?.beneficiariosNucleo?.filter(b => (b.genero ?? '').toLowerCase().startsWith('m')).length ?? 0;
  }

  get porcentajeAsignadosProyecto(): number {
    const totalBeneficiarios = this.beneficiariosCount;
    if (!totalBeneficiarios) return 0;
    return Math.round((this.proyectosActivos / totalBeneficiarios) * 100);
  }

  get actasEntregadasCount(): number {
    return this.detalle?.actas?.filter(acta => acta.estado === 'E').length ?? 0;
  }

  get actasPendientesCount(): number {
    return this.detalle?.actas?.filter(acta => acta.estado === 'P').length ?? 0;
  }

  get pageSizeOptions(): number[] {
    return this.isMobileView ? [5, 10] : [5, 10, 20];
  }

  get filteredBeneficiariosNucleo() {
    const beneficiarios = this.detalle?.beneficiariosNucleo ?? [];
    const filtro = this.filtroBeneficiario.trim().toLowerCase();
    if (!filtro) return beneficiarios;

    return beneficiarios.filter((b) => {
      const nombre = `${b.primerNombre ?? ''} ${b.primerApellido ?? ''}`.toLowerCase();
      const documento = `${b.numeroDocumento ?? ''}`.toLowerCase();
      return nombre.includes(filtro) || documento.includes(filtro);
    });
  }

  get beneficiariosTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBeneficiariosNucleo.length / this.beneficiariosPageSize));
  }

  get beneficiariosCurrentPage(): number {
    return Math.min(this.beneficiariosPage, this.beneficiariosTotalPages);
  }

  get paginatedBeneficiariosNucleo() {
    const start = (this.beneficiariosCurrentPage - 1) * this.beneficiariosPageSize;
    return this.filteredBeneficiariosNucleo.slice(start, start + this.beneficiariosPageSize);
  }

  get beneficiariosPageStart(): number {
    if (!this.filteredBeneficiariosNucleo.length) return 0;
    return (this.beneficiariosCurrentPage - 1) * this.beneficiariosPageSize + 1;
  }

  get beneficiariosPageEnd(): number {
    if (!this.filteredBeneficiariosNucleo.length) return 0;
    return Math.min(this.beneficiariosCurrentPage * this.beneficiariosPageSize, this.filteredBeneficiariosNucleo.length);
  }

  get proyectosTotalPages(): number {
    const total = this.detalle?.beneficiariosProyecto?.length ?? 0;
    return Math.max(1, Math.ceil(total / this.proyectosPageSize));
  }

  get proyectosCurrentPage(): number {
    return Math.min(this.proyectosPage, this.proyectosTotalPages);
  }

  get paginatedBeneficiariosProyecto() {
    const proyectos = this.detalle?.beneficiariosProyecto ?? [];
    const start = (this.proyectosCurrentPage - 1) * this.proyectosPageSize;
    return proyectos.slice(start, start + this.proyectosPageSize);
  }

  get proyectosPageStart(): number {
    const total = this.detalle?.beneficiariosProyecto?.length ?? 0;
    if (!total) return 0;
    return (this.proyectosCurrentPage - 1) * this.proyectosPageSize + 1;
  }

  get proyectosPageEnd(): number {
    const total = this.detalle?.beneficiariosProyecto?.length ?? 0;
    if (!total) return 0;
    return Math.min(this.proyectosCurrentPage * this.proyectosPageSize, total);
  }

  setTab(tab: NucleoDetalleTab): void {
    this.activeTab = tab;
  }

  onBeneficiarioFilterChange(): void {
    this.beneficiariosPage = 1;
  }

  onBeneficiariosPageSizeChange(): void {
    this.beneficiariosPage = 1;
  }

  onProyectosPageSizeChange(): void {
    this.proyectosPage = 1;
  }

  nextBeneficiariosPage(): void {
    this.beneficiariosPage = Math.min(this.beneficiariosCurrentPage + 1, this.beneficiariosTotalPages);
  }

  prevBeneficiariosPage(): void {
    this.beneficiariosPage = Math.max(this.beneficiariosCurrentPage - 1, 1);
  }

  nextProyectosPage(): void {
    this.proyectosPage = Math.min(this.proyectosCurrentPage + 1, this.proyectosTotalPages);
  }

  prevProyectosPage(): void {
    this.proyectosPage = Math.max(this.proyectosCurrentPage - 1, 1);
  }

  private updateViewportMode(): void {
    this.isMobileView = window.innerWidth < 640;
    const availableSizes = this.pageSizeOptions;

    if (!availableSizes.includes(this.beneficiariosPageSize)) {
      this.beneficiariosPageSize = 10;
      this.beneficiariosPage = 1;
    }

    if (!availableSizes.includes(this.proyectosPageSize)) {
      this.proyectosPageSize = 10;
      this.proyectosPage = 1;
    }
  }

  async exportarPdf(): Promise<void> {
    if (!this.detalle || this.loadingPdf) return;
    this.loadingPdf = true;
    try {
      await this.pdfService.generateNucleoReport(this.detalle);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    } finally {
      this.loadingPdf = false;
    }
  }
}
