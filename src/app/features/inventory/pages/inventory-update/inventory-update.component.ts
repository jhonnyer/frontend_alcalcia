import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { IProducto } from '../../../../core/models/products.model';
import { AlertService } from '../../../../core/services/alert.service';
import { finalize } from 'rxjs';
import { NonNegativeIntegerDirective } from '../../../../shared/directives/non-negative-integer.directive';

@Component({
  selector: 'app-inventory-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NonNegativeIntegerDirective],
  templateUrl: './inventory-update.component.html',
  styleUrl: './inventory-update.component.scss'
})
export class InventoryUpdateComponent {
  @Input('id') productoId!: string;

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private pageTitleService = inject(PageTitleService);
  private productosService = inject(ProductosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);
  producto: IProducto | null = null;
  isSaving = false;

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar Producto');
    this.initFormFamilyCore();
    this.loadProductData();
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      fechaIngreso: [null]
    });
  }

  private loadProductData(): void {
    this.productosService.getById(this.productoId).subscribe({
      next: (response) => {
        if (response) {
          this.producto = response;
          this.formFamilyCore.patchValue({
            nombre: this.producto?.nombre,
            descripcion: this.producto?.descripcion,
            stock: 0,
            fechaIngreso: this.producto?.fechaIngreso
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.alert.error('Error servicio','Error al cargar los datos del producto');
      }
    });
  }

  onSubmit(): void {
    if (this.isSaving) return;
    if (this.formFamilyCore.valid) {
      const dataToSend = {
        nombre: this.formFamilyCore.value.nombre,
        descripcion: this.formFamilyCore.value.descripcion,
        stock: Number(this.formFamilyCore.value.stock),
        fechaIngreso: this.formFamilyCore.value.fechaIngreso
      };

      this.isSaving = true;
      this.productosService.updateById(this.productoId, dataToSend).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: (response) => {
          this.alert.success('Operación exitosa','Producto actualizado correctamente');
          this.cancelar();
        },
        error: (error) => {
          console.error('Error:', error);
          this.alert.error('Operación fallida','Error al actualizar el producto');
        }
      });
    } else {
      this.alert.warning('Formulario Inválido','Por favor, revisa los campos del formulario');
      this.formFamilyCore.markAllAsTouched();
    }
  }

  cancelar(): void {
    this.router.navigate(['/inventory'], {
      queryParams: {
        idProyecto: this.route.snapshot.queryParamMap.get('idProyecto'),
        idCategoria: this.route.snapshot.queryParamMap.get('idCategoria')
      }
    });
  }
}
