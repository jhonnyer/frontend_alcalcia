import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { IProyecto, IProyectoCategorias } from '../../../../core/models/proyecto.model';
import { ICategorias } from '../../../../core/models/categorias.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { HasRoleDirective } from '../../../../core/directives/has-role/has-role-directive.directive';
import { ReportesPdfService } from '../../../../core/services/reportes-pdf.service';
import { pdfErrorMessage } from '../../../../shared/components/pdf/pdf-export.utils';
import { AlertService } from '../../../../core/services/alert.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { CategoriasCreateComponent } from '../../../categorias/categorias-create/categorias-create.component';
import { ProductoModalComponent } from '../../../inventory/pages/product-modal/producto-modal.component';
import { InventoryCreateComponent, InventoryCreateDialogData } from '../../../inventory/pages/inventory-create/inventory-create.component';
import { IProductoFk } from '../../../../core/models/products.model';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-project-update',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatRadioModule,
    MatSelectModule, MatIconModule, MatInputModule, MatButtonModule, MatPaginatorModule, HasRoleDirective
  ],
  templateUrl: './project-update.component.html',
  styleUrl: './project-update.component.scss'
})
export class ProjectUpdateComponent implements OnInit {
  @Input() modo: 'crear' | 'editar' = 'crear';
  formFamilyCore: FormGroup = new FormGroup({});
  categorias = signal<ICategorias[]>([]);
  selectedCategoryId = signal<number | null>(null);
  selectedCategory = computed(() => this.categorias().find(categoria =>
    categoria.idCategoria === this.selectedCategoryId()
  ) ?? null);
  productFilter = signal('');
  productPage = signal(0);
  productPageSize = signal(5);
  filteredProducts = computed(() => {
    const filter = this.normalizeSearchText(this.productFilter());
    return (this.selectedCategory()?.productos ?? []).filter(product =>
      [product.nombreProducto, product.descripcion, product.fechaIngreso, product.stock]
        .some(value => this.normalizeSearchText(value).includes(filter))
    );
  });
  pagedProducts = computed(() => this.filteredProducts().slice(
    this.productPage() * this.productPageSize(),
    (this.productPage() + 1) * this.productPageSize()
  ));
  totalProductos = computed(() => this.categorias().reduce((total, categoria) =>
    total + (categoria.productos?.length ?? 0), 0
  ));
  loadingProject = false;
  refreshingInventory = false;
  inventoryError = '';
  projectLoadError = '';
  saving = false;
  loadingPdf = false;
  proyectoId?: string;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private proyectosService = inject(ProyectosService);
  private categoriasService = inject(CategoriasService);
  private pageTitleService = inject(PageTitleService);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);
  private dialog = inject(MatDialog);
  private pdfService = inject(ReportesPdfService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Gestión de Proyecto');
    this.formFamilyCore = this.fb.group({
      nombre: ['', Validators.required],
      tipoProyecto: ['', Validators.required],
      contrato: ['', Validators.maxLength(100)],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      estado: ['A', Validators.required],
      descripcion: ['']
    });
    this.modo = this.route.snapshot.data['modo'] || 'crear';
    this.proyectoId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.modo === 'editar' && this.proyectoId) this.getProyectoById();
  }

  getProyectoById(inventoryOnly = false, preferredCategoryId = this.selectedCategoryId()): void {
    if (!this.proyectoId) {
      this.alert.error('Proyecto no disponible', 'No se encontró el identificador del proyecto.');
      return;
    }
    if (inventoryOnly) {
      this.refreshingInventory = true;
      this.inventoryError = '';
    } else {
      this.loadingProject = true;
      this.projectLoadError = '';
    }
    this.proyectosService.getById(this.proyectoId).pipe(
      finalize(() => {
        this.loadingProject = false;
        this.refreshingInventory = false;
      })
    ).subscribe({
      next: ({ respuesta }) => {
        const { proyecto, categorias } = respuesta;
        if (!inventoryOnly) this.formFamilyCore.patchValue({
          nombre: proyecto.nombre,
          tipoProyecto: proyecto.tipoProyecto?.trim().toUpperCase() || '',
          contrato: proyecto.contrato ?? '',
          fechaInicio: proyecto.fechaInicio?.substring(0, 10) || '',
          fechaFin: proyecto.fechaFin?.substring(0, 10) || '',
          estado: proyecto.estado?.trim().toUpperCase() || '',
          descripcion: proyecto.descripcion
        });
        this.categorias.set(categorias ?? []);
        const categoryId = this.categorias().find(categoria => categoria.idCategoria === preferredCategoryId)?.idCategoria
          ?? this.categorias()[0]?.idCategoria ?? null;
        if (categoryId !== this.selectedCategoryId()) {
          this.productFilter.set('');
          this.productPage.set(0);
        }
        this.selectedCategoryId.set(categoryId);
        this.productPage.set(Math.min(this.productPage(),
          Math.max(0, Math.ceil(this.filteredProducts().length / this.productPageSize()) - 1)));
      },
      error: error => {
        console.error('Error al cargar proyecto:', error);
        if (inventoryOnly) {
          this.inventoryError = 'No se pudo actualizar el inventario del proyecto. Reintenta antes de continuar.';
        } else {
          this.projectLoadError = 'No se pudo cargar el proyecto. Reintenta antes de editar sus datos.';
        }
      }
    });
  }

  private getTransformedData(): IProyectoCategorias {
    const fv = this.formFamilyCore.value;
    return {
      proyecto: {
        ...(this.proyectoId ? { idProyecto: Number(this.proyectoId) } : {}),
        nombre: fv.nombre?.trim(),
        descripcion: fv.descripcion?.trim(),
        estado: fv.estado,
        fechaInicio: fv.fechaInicio,
        fechaFin: fv.fechaFin,
        tipoProyecto: fv.tipoProyecto,
        contrato: fv.contrato?.trim() || null
      } as IProyecto,
      categorias: this.categorias().map(categoria => ({ idCategoria: categoria.idCategoria }))
    };
  }

  onSubmit(): void {
    if (this.saving || this.loadingProject || this.projectLoadError || this.refreshingInventory || this.inventoryError) return;
    if (this.formFamilyCore.invalid) {
      this.alert.warning('Formulario inválido', 'Por favor completa los campos requeridos antes de continuar.');
      this.formFamilyCore.markAllAsTouched();
      return;
    }
    const dataToSend = this.getTransformedData();
    this.saving = true;
    if (this.modo === 'editar' && this.proyectoId) {
      this.proyectosService.updateById(this.proyectoId, dataToSend).pipe(
        finalize(() => this.saving = false)
      ).subscribe({
        next: () => {
          this.alert.success('Operación exitosa', 'Proyecto actualizado correctamente');
          this.router.navigate(['projects']);
        },
        error: error => {
          console.error('Error al actualizar:', error);
          this.alert.error('Operación fallida', 'No se pudo actualizar el proyecto. Intenta nuevamente.');
        }
      });
    } else {
      this.proyectosService.post(dataToSend).pipe(
        finalize(() => this.saving = false)
      ).subscribe({
        next: response => {
          const nuevoId = response?.respuesta?.proyecto?.idProyecto;
          if (nuevoId) {
            this.alert.success('Operación exitosa', 'Proyecto creado correctamente');
            this.router.navigate(['projects/update', nuevoId]);
          } else {
            console.error('El backend no devolvió el idProyecto');
            this.alert.warning('Verifica el registro', 'No se recibió el identificador del proyecto. Consulta la lista antes de intentar registrarlo nuevamente.');
            this.router.navigate(['projects']);
          }
        },
        error: error => {
          console.error('Error al crear:', error);
          this.alert.error('Operación fallida', 'No se pudo crear el proyecto. Intenta nuevamente.');
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['projects']);
  }

  confirmarActualizacion(): void {
    if (this.saving || this.loadingProject || this.projectLoadError || this.refreshingInventory || this.inventoryError) return;
    if (this.formFamilyCore.invalid) {
      this.alert.warning('Formulario inválido', 'Verifica los campos del formulario');
      this.formFamilyCore.markAllAsTouched();
      return;
    }
    this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Deseas guardar los cambios de este proyecto?' }
    }).afterClosed().subscribe(confirmado => {
      if (confirmado) this.onSubmit();
    });
  }

  async gestionarInventario(idCategoria?: number): Promise<void> {
    if (this.formFamilyCore.dirty) {
      const salir = await this.alert.confirm(
        'Cambios sin guardar',
        'Los cambios del proyecto no se han guardado. Puedes cancelar para guardarlos antes de abrir el inventario.',
        'Salir sin guardar',
        'Seguir editando'
      );
      if (!salir) return;
    }
    this.router.navigate(['/inventory'], {
      queryParams: { idProyecto: this.proyectoId, ...(idCategoria ? { idCategoria } : {}) }
    });
  }

  selectCategory(event: Event): void {
    this.selectedCategoryId.set(Number((event.target as HTMLSelectElement).value) || null);
    this.productFilter.set('');
    this.productPage.set(0);
  }

  filterProducts(value: string): void {
    this.productFilter.set(value);
    this.productPage.set(0);
  }

  changeProductPage(event: PageEvent): void {
    this.productPage.set(event.pageIndex);
    this.productPageSize.set(event.pageSize);
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }

  editCategory(categoria?: ICategorias): void {
    this.dialog.open(CategoriasCreateComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 32px)',
      data: { idProyecto: Number(this.proyectoId), modo: categoria ? 'editar' : 'crear', categoria },
      autoFocus: false
    }).afterClosed().subscribe((result: ICategorias | undefined) => {
      this.pageTitleService.setCurrentPage('Gestión de Proyecto');
      if (result) this.getProyectoById(true, categoria?.idCategoria ?? result.idCategoria);
    });
  }

  addProducts(categoria: ICategorias): void {
    this.dialog.open<InventoryCreateComponent, InventoryCreateDialogData, boolean>(InventoryCreateComponent, {
      width: '1100px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '90vh',
      data: {
        idProyecto: Number(this.proyectoId),
        idCategoria: categoria.idCategoria,
        lockContext: true
      },
      ariaLabelledBy: 'inventory-create-title',
      disableClose: true,
      autoFocus: 'first-tabbable'
    }).afterClosed().subscribe(saved => {
      if (saved) this.getProyectoById(true, categoria.idCategoria);
    });
  }

  editProduct(categoria: ICategorias, producto: IProductoFk): void {
    this.dialog.open(ProductoModalComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        modo: 'editar',
        idProyecto: Number(this.proyectoId),
        idCategoria: categoria.idCategoria,
        producto
      },
      autoFocus: false
    }).afterClosed().subscribe(result => {
      if (result) this.getProyectoById(true, categoria.idCategoria);
    });
  }

  deleteCategory(categoria: ICategorias): void {
    this.categoriasService.getById(String(categoria.idCategoria)).subscribe({
      next: async current => {
        if (current.productos?.length) {
          this.alert.warning('Categoría con productos', 'Esta categoría tiene productos asociados y no se puede eliminar. Puedes editar su nombre o descripción.');
          return;
        }
        const confirmed = await this.alert.confirm('Eliminar categoría',
          `¿Deseas eliminar la categoría "${current.nombre}"?`, 'Eliminar', 'Cancelar');
        if (!confirmed) return;
        this.categoriasService.delete(String(current.idCategoria)).subscribe({
          next: () => {
            this.alert.success('Operación exitosa', 'Categoría eliminada correctamente.');
            this.getProyectoById(true);
          },
          error: error => {
            console.error('Error al eliminar categoría:', error);
            this.alert.error('Operación fallida', 'No se pudo eliminar la categoría. Intenta nuevamente.');
          }
        });
      },
      error: error => {
        console.error('Error al consultar categoría:', error);
        this.alert.error('Operación fallida', 'No se pudo verificar la categoría. Intenta nuevamente.');
      }
    });
  }

  exportarPdf(): void {
    if (this.loadingPdf) return;
    if (!this.proyectoId) {
      this.alert.warning('Alerta', 'Primero debes guardar el proyecto antes de exportar.');
      return;
    }
    this.loadingPdf = true;
    this.pdfService.proyecto(Number(this.proyectoId)).catch(error => {
      console.error('Error al generar PDF:', error);
      this.alert.error('No se pudo exportar el PDF', pdfErrorMessage(error));
    }).finally(() => this.loadingPdf = false);
  }
}
