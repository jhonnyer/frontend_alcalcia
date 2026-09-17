import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal, ChangeDetectorRef, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProyectosService } from '../../../../core/services/proyectos.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

import { IProyecto, IProyectoCategorias } from '../../../../core/models/proyecto.model';
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
import { CategoriasCreateComponent } from '../../../categorias/categorias-create/categorias-create.component';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { ProductoModalComponent } from '../../../inventory/pages/product-modal/producto-modal.component';
import { IProductoFk } from '../../../../core/models/products.model';
import { PdfGeneradorProyectoService } from '../../../../shared/components/pdf/pdf-proyectos.service';
import { AlertService } from '../../../../core/services/alert.service';

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
    HasRoleDirective
  ],
  templateUrl: './project-update.component.html',
  styleUrl: './project-update.component.scss'
})
export class ProjectUpdateComponent implements OnInit {
  constructor(private dialog: MatDialog, private pdfService: PdfGeneradorProyectoService) {}

  @Input() modo: 'crear' | 'editar' = 'crear';

  formFamilyCore: FormGroup = new FormGroup({});
  categorias = signal<ICategoriaUI[]>([]);
  filtroCategoria = '';
  filtroProducto = '';
  displayedColumns: string[] = ['nombreProducto', 'stock', 'fechaIngreso', 'acciones'];
  // 🔹 Filtro y selección de categoría
  categoriaSeleccionada = signal<ICategoriaUI | null>(null);
  categoriaActivaId = signal<number | null>(null);
  filtroCategorias = signal<string>('');
  categorySearch = signal('');
  categorySuggestionsVisible = signal(false);
  filteredCategoryOptions = computed(() => {
    const query = this.normalizeSearchText(this.categorySearch());
    return this.categorias().filter(categoria => {
      const text = this.normalizeSearchText(`${categoria.idCategoria} ${categoria.nombre} ${categoria.descripcion}`);
      return !query || text.includes(query);
    });
  });
  pageIndex = 0;
  pageSize = 5;
  modoCreacion = false;
  loadingPdf = false; 

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private proyectosService = inject(ProyectosService);
  private pageTitleService = inject(PageTitleService);
  private categoriasService = inject(CategoriasService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  proyectoId?: string;

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage("Gestión de Proyecto");
    this.initFormFamilyCore();

    // 🔹 Detecta el modo desde la ruta
    this.modo = (this.route.snapshot.data['modo'] as 'crear' | 'editar') || 'crear';
    this.proyectoId = this.route.snapshot.paramMap.get('id') || undefined;

    if (this.modo === 'editar' && this.proyectoId) {
      this.getProyectoById();
    }
  }

  // 🔹 Inicialización del formulario
  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      tipoProyecto: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: [''],
      estado: ['A', [Validators.required]],
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

        const categoriasUI = (categorias || []).map(cat => ({
          ...cat,
          expanded: false,
          currentPage: 0,
          pageSize: 5,
          filtro: ''
        }));
        const categoriaActual = categoriasUI.find(cat => cat.idCategoria === this.categoriaActivaId())
          ?? categoriasUI[0]
          ?? null;
        if (categoriaActual) {
          categoriaActual.expanded = true;
        }
        this.categorias.set(categoriasUI);
        this.categoriaActivaId.set(categoriaActual?.idCategoria ?? null);
        this.categoriaSeleccionada.set(categoriaActual);
        this.categorySearch.set(categoriaActual ? `#${categoriaActual.idCategoria} - ${categoriaActual.nombre}` : '');

        // para que Material refresque bind de select/radio si llegó tarde
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error al cargar proyecto:', e)
    });
  }

  // 🔹 Filtra categorías que se muestran actualmente
  getCategoriasFiltradas(): ICategoriaUI[] {
    const filtro = this.filtroCategorias().toLowerCase();
    return this.categorias().filter(cat =>
      cat.nombre.toLowerCase().includes(filtro)
    );
  }

  // 🔹 Cuando el usuario selecciona una categoría del combo
  onSeleccionarCategoria(categoria: ICategoriaUI): void {
    this.categoriaSeleccionada.set(categoria);
    this.categoriaActivaId.set(categoria.idCategoria);
    categoria.expanded = true;
  }

  onCategoriaActivaChange(value: number | string | null): void {
    const idCategoria = value === null || value === '' ? null : Number(value);
    this.categoriaActivaId.set(idCategoria);
    this.pageIndex = 0;
    this.categorias.update(categorias => categorias.map(categoria => ({
      ...categoria,
      expanded: categoria.idCategoria === idCategoria,
      currentPage: 0
    })));
    this.categoriaSeleccionada.set(
      this.categorias().find(categoria => categoria.idCategoria === idCategoria) ?? null
    );
    const categoria = this.categoriaSeleccionada();
    this.categorySearch.set(categoria ? `#${categoria.idCategoria} - ${categoria.nombre}` : '');
    this.categorySuggestionsVisible.set(false);
  }

  onCategorySearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.categorySearch.set(value);
    this.categorySuggestionsVisible.set(true);
    if (this.categoriaActivaId()) {
      this.categoriaActivaId.set(null);
      this.categoriaSeleccionada.set(null);
    }
  }

  selectCategoryOption(categoria: ICategoriaUI): void {
    this.onCategoriaActivaChange(categoria.idCategoria);
  }

  clearCategorySearch(): void {
    this.categorySearch.set('');
    this.categoriaActivaId.set(null);
    this.categoriaSeleccionada.set(null);
    this.categorySuggestionsVisible.set(false);
  }

  showCategorySuggestions(): void {
    this.categorySuggestionsVisible.set(true);
  }

  hideCategorySuggestions(): void {
    setTimeout(() => this.categorySuggestionsVisible.set(false), 150);
  }


  // 🔹 Verifica si una categoría está seleccionada
  isCategoriaSeleccionada(idCategoria: number): boolean {
    const seleccionadas = this.formFamilyCore.get('categorias')?.value || [];
    return seleccionadas.some((c: any) => c.idCategoria === idCategoria);
  }

  // 🔹 Devuelve los productos filtrados + paginados por categoría
  getPagedData(categoria: any) {
    if (!categoria.productos) return [];

    const startIndex = (categoria.currentPage || 0) * (categoria.pageSize || 3);
    const endIndex = startIndex + (categoria.pageSize || 3);

    const filtro = this.normalizeSearchText(categoria.filtro);
    const filtrados = categoria.productos.filter((p: any) =>
      this.productMatchesFilter(p, filtro)
    );

    return filtrados.slice(startIndex, endIndex);
  }

  clearProductFilter(categoria: ICategoriaUI): void {
    categoria.filtro = '';
    categoria.currentPage = 0;
  }

  onProductFilterChange(categoria: ICategoriaUI): void {
    categoria.currentPage = 0;
  }

  getStockBadgeClass(stock: number | null | undefined): string {
    const value = Number(stock ?? 0);
    if (value <= 0) return 'bg-red-100 text-red-700 border-red-200';
    if (value <= 5) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }

  // 🔹 Actualiza página actual por categoría
  onPageChange(event: any, categoria: any) {
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

    const categoriasSeleccionadas = this.categorias().map(c => ({
      idCategoria: Number(c.idCategoria),
    }));

    // Si estás editando, incluye idProyecto
    if (this.proyectoId) {
      return {
        proyecto: {
          idProyecto: Number(this.proyectoId),
          nombre: fv.nombre?.trim(),
          descripcion: fv.descripcion?.trim(),
          estado: fv.estado,
          fechaInicio: fv.fechaInicio,
          fechaFin: fv.fechaFin,
          tipoProyecto: fv.tipoProyecto,
        },
        categorias: categoriasSeleccionadas,
      };
    }

    // Si estás creando, no envíes idProyecto
    return {
      proyecto: {
        nombre: fv.nombre?.trim(),
        descripcion: fv.descripcion?.trim(),
        estado: fv.estado,
        fechaInicio: fv.fechaInicio,
        fechaFin: fv.fechaFin,
        tipoProyecto: fv.tipoProyecto,
        // sin idProyecto
      } as IProyecto,
      categorias: categoriasSeleccionadas,
    };
  }


  // 🔹 Guardar cambios
  onSubmit(): void {
    if (this.formFamilyCore.invalid) {
      this.alert.warning('Formulario Inválido','⚠️ Por favor completa los campos requeridos antes de continuar.');
      this.formFamilyCore.markAllAsTouched();
      return;
    }

    const dataToSend = this.getTransformedData();

    if (this.modo === 'editar' && this.proyectoId) {
      this.proyectosService.updateById(this.proyectoId, dataToSend).subscribe({
        next: () => {
          this.alert.success('Operación exitosa','✅ Proyecto actualizado correctamente');
          this.router.navigate(['projects']);
        },
        error: (error) => console.error('Error al actualizar:', error)
      });
    } else {
      this.proyectosService.post(dataToSend).subscribe({
        next: (response) => {
          const nuevoId = response?.respuesta?.proyecto?.idProyecto;
          if (nuevoId) {
            this.alert.success('Operación exitosa','✅ Proyecto creado correctamente');
            // 🟢 Redirigimos al modo edición del nuevo proyecto
            this.router.navigate(['projects/update', nuevoId]);
          } else {
            console.warn('⚠️ El backend no devolvió el idProyecto');
            this.router.navigate(['projects']);
          }
        },
        error: (error) => console.error('Error al crear:', error)
      });
    }
  }


  // 🔹 Cancelar
  cancelar(): void {
    this.router.navigate(['projects']);
  }

  // 🔹 Longitud total de productos filtrados (para el paginador)
  getFilteredLength(categoria: any): number {
    if (!categoria.productos) return 0;
    const filtro = this.normalizeSearchText(categoria.filtro);
    return categoria.productos.filter((p: any) =>
      this.productMatchesFilter(p, filtro)
    ).length;
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim();
  }

  private productMatchesFilter(product: IProductoFk, filter: string): boolean {
    if (!filter) return true;
    return [
      product.nombreProducto,
      product.descripcion,
      product.stock,
      product.fechaIngreso
    ].some(value => this.normalizeSearchText(value).includes(filter));
  }

  confirmarActualizacion(): void {
    if (this.formFamilyCore.invalid) {
      this.alert.warning('Formulario Inválido','⚠️ Verifica los campos del formulario');
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

  abrirDialogNuevaCategoria(): void {
    const dialogRef = this.dialog.open(CategoriasCreateComponent, {
      width: '500px',
      data: { idProyecto: this.proyectoId },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((nuevaCategoria) => {
      if (nuevaCategoria) {
        // Añadir la categoría recién creada al proyecto actual
        const categoriaConCamposUI: ICategoriaUI = {
          ...nuevaCategoria,
          productos: [],
          expanded: false,
          currentPage: 0,
          pageSize: 3,
          filtro: ''
        };
        
        this.categorias.update(prev => [...prev, categoriaConCamposUI]);
        this.onCategoriaActivaChange(nuevaCategoria.idCategoria);

        // Actualizar el formControl 'categorias' (ids)
        const actual = this.formFamilyCore.get('categorias')?.value || [];
        this.formFamilyCore.get('categorias')?.setValue([
          ...actual,
          { idCategoria: nuevaCategoria.idCategoria }
        ]);
      }
    });
  }


  getCategoriasFiltradasPaginadas(): ICategoriaUI[] {
    const filtro = this.filtroCategorias().toLowerCase();
    const categoriaActivaId = this.categoriaActivaId();
    const filtradas = this.categorias().filter(cat =>
      (!categoriaActivaId || cat.idCategoria === categoriaActivaId) &&
      cat.nombre.toLowerCase().includes(filtro)
    );
    const start = this.pageIndex * this.pageSize;
    return filtradas.slice(start, start + this.pageSize);
  }

  getFilteredLengthGlobal(): number {
    const filtro = this.filtroCategorias().toLowerCase();
    const categoriaActivaId = this.categoriaActivaId();
    return this.categorias().filter(cat =>
      (!categoriaActivaId || cat.idCategoria === categoriaActivaId) &&
      cat.nombre.toLowerCase().includes(filtro)
    ).length;
  }

  onPageChangeGlobal(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  trackByCategoriaId(index: number, categoria: ICategoriaUI): number {
    return categoria.idCategoria;
  }

  abrirDialogEditarCategoria(categoria: ICategorias): void {
    const dialogRef = this.dialog.open(CategoriasCreateComponent, {
      width: '500px',
      data: { 
        modo: 'editar',
        categoria,
        idProyecto: this.proyectoId
      },
      disableClose: true,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        // Actualizar lista local después de editar
        this.getProyectoById();
      }
    });
  }

  confirmarEliminacion(categoria: ICategorias): void {
    if (categoria.productos && categoria.productos.length > 0) {
      this.alert.warning('Alerta','⚠️ No se puede eliminar la categoría porque tiene productos asociados.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: `¿Deseas eliminar la categoría "${categoria.nombre}"?` }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.categoriasService.delete(String(categoria.idCategoria)).subscribe({
          next: () => {
            this.alert.success('Operación exitosa','✅ Categoría eliminada correctamente.');
            this.getProyectoById(); // refresca lista
          },
          error: (error) => {
            console.error('❌ Error al eliminar categoría:', error);
            this.alert.error('Error del servicio','⚠️ No se pudo eliminar la categoría. Intenta nuevamente.');
          }
        });
      }
    });
  }

  editarProducto(producto: IProductoFk, categoria: ICategorias): void {
    const idCategoriaActual = categoria.idCategoria; 
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '500px',
      data: {
        modo: 'editar',
        idProyecto: Number(this.proyectoId),
        idCategoria: categoria.idCategoria,
        producto
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((ok) => {
      if (ok) {
        this.refrescarCategoriaActiva(idCategoriaActual);
      }
    });
  }
  
  abrirDialogNuevoProducto(categoria: ICategorias): void {
    const idCategoriaActual = categoria.idCategoria;
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '500px',
      data: {
        modo: 'crear',
        idProyecto: Number(this.proyectoId),
        idCategoria: categoria.idCategoria
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((ok) => {
    if (ok) {
        this.refrescarCategoriaActiva(idCategoriaActual);
      }
    });

  }

  private refrescarCategoriaActiva(idCategoria: number): void {
    const categoriaExpandida = this.categorias().find(cat => cat.idCategoria === idCategoria);
    const paginaActual = categoriaExpandida?.currentPage || 0;
    const filtroActual = categoriaExpandida?.filtro || '';

    this.getProyectoById();

    setTimeout(() => {
      const categoriaActualizada = this.categorias().find(cat => cat.idCategoria === idCategoria);
      if (categoriaActualizada) {
        categoriaActualizada.expanded = true;
        categoriaActualizada.currentPage = paginaActual;
        categoriaActualizada.filtro = filtroActual;
        this.categoriaActivaId.set(categoriaActualizada.idCategoria);
        this.categoriaSeleccionada.set(categoriaActualizada);
      }
    }, 300);
  }

  exportarPdf(): void {
    if (!this.proyectoId) {
      this.alert.warning('Alerta','⚠️ Primero debes guardar el proyecto antes de exportar.');
      return;
    }

    this.loadingPdf = true;
    this.proyectosService.getProyectoDetallado(this.proyectoId!).subscribe({
      next: ({ respuesta }) => {
        this.pdfService.generateProjectReport(respuesta);
        this.loadingPdf = false;
      },
      error: (err) => {
        console.error('Error al generar PDF:', err);
        this.loadingPdf = false;
        this.alert.error('Error del servicio','❌ Error al generar el PDF del proyecto.');
      }
    });
  }

}