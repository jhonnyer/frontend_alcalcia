import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { IProducto } from '../../../../core/models/products.model';

@Component({
  selector: 'app-inventory-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './inventory-update.component.html',
  styleUrl: './inventory-update.component.scss'
})
export class InventoryUpdateComponent {
  @Input() productoId!: string;

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private pageTitleService = inject(PageTitleService);
  private productosService = inject(ProductosService);
  private router = inject(Router);
  producto: IProducto | null = null;

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar Producto');
    this.initFormFamilyCore();
    this.loadProductData();
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      stock: ['', [Validators.required, Validators.min(0)]],
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
            stock: this.producto?.stock,
            fechaIngreso: this.producto?.fechaIngreso
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        alert('Error al cargar los datos del producto');
      }
    });
  }

  onSubmit(): void {
    if (this.formFamilyCore.valid) {
      const dataToSend = {
        nombre: this.formFamilyCore.value.nombre,
        descripcion: this.formFamilyCore.value.descripcion,
        stock: Number(this.formFamilyCore.value.stock),
        fechaIngreso: this.formFamilyCore.value.fechaIngreso
      };

      this.productosService.updateById(this.productoId, dataToSend).subscribe({
        next: (response) => {
          alert('Producto actualizado correctamente');
          this.router.navigate(['/inventory']);
        },
        error: (error) => {
          console.error('Error:', error);
          alert('Error al actualizar el producto');
        }
      });
    } else {
      alert('Por favor, revisa los campos del formulario');
      this.formFamilyCore.markAllAsTouched();
    }
  }
}
