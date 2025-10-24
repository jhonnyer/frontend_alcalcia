import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ICategorias } from '../../../../core/models/categorias.model';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { Router } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-inventory-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  private dialog = inject(MatDialog);
  private alert = inject(AlertService);


  proyectos = signal<IProyectoAndCategoriaArray[]>([]);
  categoriasDisponibles = signal<ICategorias[]>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Agregar producto');
    this.initFormFamilyCore();
    this.loadProyectos();
  }

  loadProyectos(): void {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        if (response.estado === 'exito') {
          this.proyectos.set(response.respuesta);
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
        this.router.navigate(['/inventory']);
      },
      error: (err) => {
        console.error('❌ Error al crear productos:', err);
        this.alert.error('Operación fallida','⚠️ Error al crear los productos.');
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/inventory']);
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
