import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProyectosService } from '../../../../core/services/proyectos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

import { IProyectoCategorias } from '../../../../core/models/proyecto.model';
import { ICategorias } from '../../../../core/models/categorias.model';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';

interface ICategoriaUI extends ICategorias {
  expanded?: boolean;
  currentPage?: number;
  pageSize?: number;
  filtro?: string;   
}

@Component({
  selector: 'app-project-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatRadioModule,
    MatSelectModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatInputModule,
  ],
  templateUrl: './project-update.component.html',
  styleUrl: './project-update.component.scss'
})
export class ProjectUpdateComponent implements OnInit {
  constructor(private dialog: MatDialog) {}

  @Input() modo: 'crear' | 'editar' = 'crear';

  formFamilyCore: FormGroup = new FormGroup({});
  categorias = signal<ICategoriaUI[]>([]);
  filtroCategoria = '';
  filtroProducto = '';
  displayedColumns: string[] = ['nombreProducto', 'stock', 'fechaIngreso'];

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private proyectosService = inject(ProyectosService);
  private categoriasService = inject(CategoriasService);
  private pageTitleService = inject(PageTitleService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  proyectoId?: string;

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage("Gestión de Proyecto");
    this.initFormFamilyCore();
    this.getAllCategorias();

    // 🔹 Detecta el modo desde la ruta
    this.modo = this.route.snapshot.data['modo'] || 'crear';
    this.proyectoId = this.route.snapshot.paramMap.get('id') || undefined;

    if (this.modo === 'editar' && this.proyectoId) {
      this.getProyectoById();
    }
  }

  private getAllCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: response => {
        this.categorias.set(response);
      },
      error: error => {
        console.error("Error al cargar categorías:", error);
      }
    });
  }

  // 🔹 Inicialización del formulario
  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      tipoProyecto: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: [''],
      estado: ['', [Validators.required]],
      descripcion: [''],
      categorias: [[]]
    });
  }
  
  private getProyectoById(): void {
    if (!this.proyectoId) {
      console.warn('⚠️ No se proporcionó un ID de proyecto para cargar.');
      return;
    }

    const id = String(this.proyectoId);
    this.proyectosService.getById(id).subscribe({
      next: ({ respuesta }) => {
        const { proyecto, categorias } = respuesta;

        this.formFamilyCore.patchValue({
          nombre: proyecto.nombre,
          tipoProyecto: proyecto.tipoProyecto?.trim().toUpperCase() || '',
          fechaInicio: proyecto.fechaInicio?.substring(0, 10) || '',
          fechaFin: proyecto.fechaFin?.substring(0, 10) || '',
          estado: proyecto.estado?.trim().toUpperCase() || '',
          descripcion: proyecto.descripcion
        });

        // 🔹 Solo categorías del proyecto
        this.categorias.set(
          (categorias || []).map(cat => ({
            ...cat,
            expanded: false,
            currentPage: 0,
            pageSize: 3,
            filtro: ''
          }))
        );

        // para que Material refresque bind de select/radio si llegó tarde
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error al cargar proyecto:', e)
    });
  }

  // 🔹 Filtra categorías que se muestran actualmente
  categoriasFiltradas(): ICategoriaUI[] {
    return this.categorias().filter(
      (cat) =>
        cat.productos?.some((p) =>
          p.nombreProducto.toLowerCase().includes(this.filtroProducto.toLowerCase())
        ) || this.filtroProducto === ''
    );
  }

  // 🔹 Añadir categoría seleccionada
  onCategoriaSeleccionada(categoria: ICategoriaUI): void {
    const yaExiste = this.categorias().some((c) => c.idCategoria === categoria.idCategoria);
    if (!yaExiste) {
      this.categorias.update((prev) => [...prev, { ...categoria, expanded: false }]);
    }
    this.filtroCategoria = '';
  }

  // 🔹 Verifica si una categoría está seleccionada
  isCategoriaSeleccionada(idCategoria: number): boolean {
    const seleccionadas = this.formFamilyCore.get('categorias')?.value || [];
    return seleccionadas.some((c: any) => c.idCategoria === idCategoria);
  }

  // Productos filtrados + paginados por categoría (usa filtro local `categoria.filtro`)
  getPagedData(categoria: ICategoriaUI) {
    const pageSize = categoria.pageSize || 3;
    const page = categoria.currentPage || 0;
    const q = (categoria.filtro || '').toLowerCase();

    const filtered = (categoria.productos || []).filter(p =>
      p.nombreProducto.toLowerCase().includes(q)
    );

    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  // 🔹 Cambiar página
  onPageChange(event: PageEvent, categoria: ICategoriaUI) {
    categoria.currentPage = event.pageIndex;
    categoria.pageSize = event.pageSize;
  }

  // 🔹 Mostrar/Ocultar productos por categoría
  toggleProductos(categoria: ICategoriaUI): void {
    categoria.expanded = !categoria.expanded;
  }

  // 🔹 Transformar datos antes de enviar al backend
  private getTransformedData(): IProyectoCategorias {
    const fv = this.formFamilyCore.value;

    // Aseguramos que el control tenga los ids actuales
    const categoriasSeleccionadas = this.categorias().map(c => ({ idCategoria: c.idCategoria }));
    this.formFamilyCore.get('categorias')?.setValue(categoriasSeleccionadas);

    return {
      proyecto: {
        idProyecto: Number(this.proyectoId),
        nombre: fv.nombre,
        descripcion: fv.descripcion,
        estado: fv.estado,
        fechaInicio: fv.fechaInicio,   // YYYY-MM-DD string
        fechaFin: fv.fechaFin,         // YYYY-MM-DD string
        tipoProyecto: fv.tipoProyecto
      },
      categorias: categoriasSeleccionadas
    };
  }

  // 🔹 Guardar cambios
  onSubmit(): void {
    if (this.formFamilyCore.invalid) {
      this.formFamilyCore.markAllAsTouched();
      return;
    }

    const dataToSend = this.getTransformedData();

    if (this.modo === 'editar' && this.proyectoId) {
      this.proyectosService.updateById(this.proyectoId, dataToSend).subscribe({
        next: () => {
          alert('✅ Proyecto actualizado correctamente');
          this.router.navigate(['projects']);
        },
        error: (error) => console.error('Error al actualizar:', error)
      });
    } else {
      this.proyectosService.post(dataToSend).subscribe({
        next: () => {
          alert('✅ Proyecto creado correctamente');
          this.router.navigate(['projects']);
        },
        error: (error) => console.error('Error al crear:', error)
      });
    }
  }


  // 🔹 Cancelar
  cancelar(): void {
    this.router.navigate(['projects']);
  }

  getFilteredLength(categoria: ICategoriaUI): number {
    const filtro = (categoria.filtro || '').toLowerCase();
    return (categoria.productos || []).filter(p =>
      p.nombreProducto.toLowerCase().includes(filtro)
    ).length;
  }

  confirmarActualizacion(): void {
    if (this.formFamilyCore.invalid) {
      alert('⚠️ Verifica los campos del formulario');
      this.formFamilyCore.markAllAsTouched();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Deseas guardar los cambios de este proyecto?' }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.onSubmit(); // ejecuta la lógica normal de guardado
      }
    });
  }


}