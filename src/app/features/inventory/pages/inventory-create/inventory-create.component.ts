import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ICategorias } from '../../../../core/models/categorias.model';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { AlertService } from '../../../../core/services/alert.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-inventory-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './inventory-create.component.html',
  styleUrl: './inventory-create.component.scss'
})
export class InventoryCreateComponent implements OnInit {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private pageTitleService = inject(PageTitleService);
  private proyectosService = inject(ProyectosService);
  private productosService = inject(ProductosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private alert = inject(AlertService);


  proyectos = signal<IProyectoAndCategoriaArray[]>([]);
  categoriasDisponibles = signal<ICategorias[]>([]);
  projectSearch = signal('');
  categorySearch = signal('');
  projectSuggestionsVisible = signal(false);
  categorySuggestionsVisible = signal(false);
  filteredProjects = computed(() => {
    const query = this.normalizeSearchText(this.projectSearch());
    return this.proyectos().filter(item => !query || this.normalizeSearchText(`${item.proyecto.idProyecto} ${item.proyecto.nombre}`).includes(query));
  });
  filteredCategories = computed(() => {
    const query = this.normalizeSearchText(this.categorySearch());
    return this.categoriasDisponibles().filter(category => !query || this.normalizeSearchText(`${category.idCategoria} ${category.nombre} ${category.descripcion}`).includes(query));
  });
  private initialProjectId: number | null = null;
  private initialCategoryId: number | null = null;

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Agregar producto');
    this.initFormFamilyCore();
    this.initialProjectId = Number(this.route.snapshot.queryParamMap.get('idProyecto')) || null;
    this.initialCategoryId = Number(this.route.snapshot.queryParamMap.get('idCategoria')) || null;
    this.loadProyectos();
  }

  loadProyectos(): void {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        if (response.estado === 'exito') {
          this.proyectos.set(response.respuesta);
          if (this.initialProjectId) {
            this.formFamilyCore.get('idProyecto')?.setValue(String(this.initialProjectId));
            this.onProyectoChange(String(this.initialProjectId));
            const project = this.proyectos().find(item => item.proyecto.idProyecto === this.initialProjectId);
            this.projectSearch.set(project ? `#${project.proyecto.idProyecto} - ${project.proyecto.nombre}` : '');
            if (this.initialCategoryId) {
              this.formFamilyCore.get('idCategoria')?.setValue(String(this.initialCategoryId));
              const category = this.categoriasDisponibles().find(item => item.idCategoria === this.initialCategoryId);
              this.categorySearch.set(category ? `#${category.idCategoria} - ${category.nombre}` : '');
            }
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.alert.error('Operación fallida','Error al cargar los proyectos');
      },
    });
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      idProyecto: ['', [Validators.required]],
      idCategoria: [{ value: '', disabled: true }, [Validators.required]],
      productos: this.fb.array([], [Validators.required, Validators.minLength(1)]),
    });

    this.formFamilyCore.get('idProyecto')?.valueChanges.subscribe((idProyecto) => {
      this.onProyectoChange(idProyecto);
    });
  }

  onProyectoChange(idProyecto: string): void {
    const proyectoSeleccionado = this.proyectos().find(
      (p) => p.proyecto.idProyecto === Number(idProyecto)
    );

    if (proyectoSeleccionado) {
      this.categoriasDisponibles.set(proyectoSeleccionado.categorias);
      const categoriaControl = this.formFamilyCore.get('idCategoria');
      categoriaControl?.enable();
      categoriaControl?.setValue('');
    } else {
      this.categoriasDisponibles.set([]);
      const categoriaControl = this.formFamilyCore.get('idCategoria');
      categoriaControl?.disable();
      categoriaControl?.setValue('');
    }
  }

  selectProjectOption(item: IProyectoAndCategoriaArray): void {
    this.projectSearch.set(`#${item.proyecto.idProyecto} - ${item.proyecto.nombre}`);
    this.projectSuggestionsVisible.set(false);
    this.formFamilyCore.get('idProyecto')?.setValue(String(item.proyecto.idProyecto));
  }

  selectCategoryOption(category: ICategorias): void {
    this.categorySearch.set(`#${category.idCategoria} - ${category.nombre}`);
    this.categorySuggestionsVisible.set(false);
    this.formFamilyCore.get('idCategoria')?.setValue(String(category.idCategoria));
  }

  onProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
    this.projectSuggestionsVisible.set(true);
    this.categorySearch.set('');
    this.formFamilyCore.get('idProyecto')?.setValue('', { emitEvent: true });
  }

  onCategorySearch(event: Event): void {
    this.categorySearch.set((event.target as HTMLInputElement).value);
    this.categorySuggestionsVisible.set(true);
    this.formFamilyCore.get('idCategoria')?.setValue('');
  }

  clearProjectFilter(): void {
    this.projectSearch.set('');
    this.categorySearch.set('');
    this.projectSuggestionsVisible.set(false);
    this.formFamilyCore.get('idProyecto')?.setValue('', { emitEvent: true });
  }

  clearCategoryFilter(): void {
    this.categorySearch.set('');
    this.categorySuggestionsVisible.set(false);
    this.formFamilyCore.get('idCategoria')?.setValue('');
  }

  showProjectSuggestions(): void {
    this.projectSuggestionsVisible.set(true);
  }

  hideProjectSuggestions(): void {
    setTimeout(() => this.projectSuggestionsVisible.set(false), 150);
  }

  showCategorySuggestions(): void {
    if (this.formFamilyCore.get('idProyecto')?.value) {
      this.categorySuggestionsVisible.set(true);
    }
  }

  hideCategorySuggestions(): void {
    setTimeout(() => this.categorySuggestionsVisible.set(false), 150);
  }

  private normalizeSearchText(value: string | number | null | undefined): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }

  get productosArray(): FormArray {
    return this.formFamilyCore.get('productos') as FormArray;
  }

  crearProductoForm(): FormGroup {
    return this.fb.group({
      nombreProducto: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      fechaIngreso: [null],
    });
  }

  addProducto(): void {
    this.productosArray.push(this.crearProductoForm());
  }

  deleteProducto(index: number): void {
    this.productosArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.formFamilyCore.invalid) {
      this.formFamilyCore.markAllAsTouched();
      this.alert.warning('Formulario inválido','⚠️ Por favor completa todos los campos requeridos.');
      return;
    }

    const formValue = this.formFamilyCore.value;
    const payload = {
      idProyecto: Number(formValue.idProyecto),
      idCategoria: Number(formValue.idCategoria),
      productos: formValue.productos.map((p: any) => ({
        nombreProducto: String(p.nombreProducto).trim(),
        descripcion: String(p.descripcion || '').trim(),
        stock: Number(p.stock),
        fechaIngreso: p.fechaIngreso || null,
      })),
    };

    this.productosService.post(payload).subscribe({
      next: () => {
        this.alert.success('Operación exitosa','✅ Productos creados correctamente.');
        this.navigateToInventoryContext(payload.idProyecto, payload.idCategoria);
      },
      error: (err) => {
        console.error('❌ Error al crear productos:', err);
        this.alert.error('Operación fallida','⚠️ Error al crear los productos.');
      },
    });
  }

  cancelar(): void {
    const idProyecto = Number(this.formFamilyCore.get('idProyecto')?.value) || this.initialProjectId;
    const idCategoria = Number(this.formFamilyCore.get('idCategoria')?.value) || this.initialCategoryId;
    this.navigateToInventoryContext(idProyecto, idCategoria);
  }

  private navigateToInventoryContext(idProyecto: number | null, idCategoria: number | null): void {
    this.router.navigate(['/inventory'], {
      queryParams: {
        ...(idProyecto ? { idProyecto } : {}),
        ...(idCategoria ? { idCategoria } : {})
      }
    });
  }

  confirmarGuardar(): void {
    if (this.formFamilyCore.invalid) {
      this.formFamilyCore.markAllAsTouched();
      this.alert.success('Formulario inválido','⚠️ Por favor completa todos los campos requeridos.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Deseas guardar estos productos en el inventario?' },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.onSubmit();
      }
    });
  }
}
