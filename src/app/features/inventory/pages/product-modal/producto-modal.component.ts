import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ProductosService } from '../../../../core/services/productos.service';
import { IProductoFk } from '../../../../core/models/products.model';   // ajusta rutas
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './producto-modal.component.html',
  styleUrl:'./producto-modal.component.scss'
})
export class ProductoModalComponent implements OnInit {
  form!: FormGroup;
  modo: 'crear' | 'editar' = 'crear';
  titulo = 'Añadir nuevo producto';

  // contexto que llega por data
  idProyecto!: number;
  idCategoria!: number;
  producto?: IProductoFk; // cuando editas
  isLoading = false;

  private fb = inject(FormBuilder);
  private productosService = inject(ProductosService);
  private dialogRef = inject(MatDialogRef<ProductoModalComponent>);
  private dialog = inject(MatDialog);


  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this.modo       = this.data?.modo ?? 'crear';
    this.idProyecto = this.data?.idProyecto;
    this.idCategoria= this.data?.idCategoria;
    this.producto   = this.data?.producto;

    this.titulo = this.modo === 'editar' ? 'Editar producto' : ' Nuevo producto';

    this.initForm();

    // precarga si estamos editando
    if (this.modo === 'editar' && this.producto) {
      this.form.patchValue({
        nombreProducto: this.producto.nombreProducto ?? '',
        stock:          0,
        descripcion:    this.producto.descripcion ?? '',
        fechaIngreso:   this.producto.fechaIngreso ?? ''
      });
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombreProducto: ['', [Validators.required, Validators.minLength(3)]],
      stock:          ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      descripcion:    ['', [Validators.required]],
      fechaIngreso:   [''] // puede ser vacío -> enviaremos null
    });
  }

  private normalizeFecha(value: string | null | undefined): string | null {
    // backend acepta null o 'YYYY-MM-DD'
    if (!value || String(value).trim() === '') return null;
    return value;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('⚠️ Por favor, completa los campos obligatorios antes de continuar.');
      return;
    }

    const mensaje =
      this.modo === 'editar'
        ? '¿Deseas actualizar este producto?'
        : '¿Deseas guardar este nuevo producto?';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return; // el usuario canceló
      this.isLoading = true; 

      const { nombreProducto, stock, descripcion, fechaIngreso } = this.form.value;

      if (this.modo === 'crear') {
        // ===== CREAR =====
        const payload = {
          idProyecto: this.idProyecto,
          idCategoria: this.idCategoria,
          productos: [
            {
              nombreProducto: String(nombreProducto).trim(),
              descripcion: String(descripcion).trim(),
              stock: Number(stock),
              fechaIngreso: fechaIngreso?.trim() ? fechaIngreso : null,
            },
          ],
        };

        this.productosService.post(payload).subscribe({
          next: () => {
            this.isLoading = false;
            alert('✅ Producto creado correctamente.');
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('❌ Error al crear producto:', err);
            alert('⚠️ Error al crear el producto.');
          },
        });
      } else {
        // ===== EDITAR =====
        if (!this.producto?.idProductoFk) {
          alert('❌ No se encontró el ID del producto a editar.');
          this.isLoading = false;
          return;
        }

        const updateData = {
          nombreProducto: String(nombreProducto).trim(),
          descripcion: String(descripcion).trim(),
          stock: Number(stock),
          fechaIngreso: fechaIngreso?.trim() ? fechaIngreso : null,
        };

        this.productosService.updateById(String(this.producto.idProductoFk), updateData).subscribe({
          next: () => {
            this.isLoading = false;
            const mensaje =
              Number(stock) > 0
                ? `✅ Se aumentó el stock en ${stock} unidades.`
                : `✅ Producto actualizado sin cambios en stock.`;

            alert(mensaje);
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('❌ Error al actualizar producto:', err);
            alert('⚠️ Error al actualizar el producto.');
          },
        });
      }
    });
  }


  cancelar(): void {
    this.dialogRef.close(false);
  }
}
