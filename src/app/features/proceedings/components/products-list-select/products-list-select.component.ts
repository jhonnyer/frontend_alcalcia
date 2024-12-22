import { Component, inject, OnInit, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { IProducto, ISelectedProduct } from '../../../../core/models/products.model';
import { ProductosService } from '../../../../core/services/productos.service';
import { CommonModule } from '@angular/common';

interface DialogData {
  idProyecto: number | null;
}

@Component({
  selector: 'app-products-list-select',
  standalone: true,
  imports: [CommonModule],
  styles: `
    th, td {
      border-bottom: 1px solid #e5e7eb; /* Gris claro */
    }
    th:last-child, td:last-child {
      border-bottom: none; /* Quitar el borde de la última columna */
    }
  `,
  templateUrl: './products-list-select.component.html',
  host: {
    class: "h-[90vh] min-w-[60vw] overflow-hidden p-5"
  }
})
export class ProductsListSelectComponent implements OnInit{

  // data = inject(DIALOG_DATA);
  data = inject<DialogData>(DIALOG_DATA);
  dialogRef = inject<DialogRef<ISelectedProduct[]>>(DialogRef<ISelectedProduct[]>);
  private productosService = inject(ProductosService);
  products: IProducto[] = [];
  selectedProducts: ISelectedProduct[] = [];

  ngOnInit(): void {
    console.log("ID Proyecto recibido:", this.data.idProyecto);
    this.getProductos();
  }

  getProductos() {
    this.productosService.getAll().subscribe({
      next: response => {
        console.log("Productos: ",response);
        this.products = response;
      },
      error: error => {
        console.log("Error al traer productos")
      }
    })
  }


  onQuantityChange(product: IProducto, input: HTMLInputElement, checkbox: HTMLInputElement) {
    const quantity = Number(input.value);
    console.log("Cambio", quantity)

    // Validate quantity doesn't exceed stock
    if (quantity > product.stock) {
      input.value = product.stock.toString();
      return;
    }

    if (checkbox.checked && quantity > 0) {
      // Add or update selected product
      const existingIndex = this.selectedProducts.findIndex(
        sp => sp.idProductoFk === product.idProducto
      );

      if (existingIndex !== -1) {
        this.selectedProducts[existingIndex].cantidad = quantity;
      } else {
        this.selectedProducts.push({
          idProductoFk: product.idProducto,
          cantidad: quantity
        });
      }
    } else {
      // Remove from selected products
      this.selectedProducts = this.selectedProducts.filter(
        sp => sp.idProductoFk !== product.idProducto
      );
    }
  }

  removeProduct(product: IProducto, checkbox: HTMLInputElement, input: HTMLInputElement) {
    // Uncheck checkbox
    checkbox.checked = false;

    // Clear input
    input.value = '';

    // Remove from selected products
    this.selectedProducts = this.selectedProducts.filter(
      sp => sp.idProductoFk !== product.idProducto
    );
  }

  close() {
    this.dialogRef.close();
  }

  closeWithRta() {
    this.dialogRef.close(this.selectedProducts);
  }
}
