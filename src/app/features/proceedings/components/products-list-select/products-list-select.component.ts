import { Component, inject, OnInit, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { IProducto, IProductoFk, ISelectedProduct } from '../../../../core/models/products.model';
import { ProductosService } from '../../../../core/services/productos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { CommonModule } from '@angular/common';
import { IProyecto, IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ICategorias } from '../../../../core/models/categorias.model';

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
  private categoriasService = inject(CategoriasService);
  private proyectosService = inject(ProyectosService);

  proyecto = signal<IProyectoAndCategoriaArray | null>(null);
  categoriaSeleccionada = signal<ICategorias | null>(null);
  products: IProductoFk[] = [];
  selectedProducts: ISelectedProduct[] = [];

  ngOnInit(): void {
    if (this.data.idProyecto) {
      this.getProjectById();
    } else {
      alert("No se ha seleccionado un proyecto");
      this.close();
    }
  }

  getCategoryById(){
    if (this.data.idProyecto) {
      this.getProjectById();
    } else {
      alert("No se ha seleccionado un proyecto");
      this.close();
    }
  }

  getProjectById() {
    this.proyectosService.getById(this.data.idProyecto!.toString()).subscribe({
      next: response => {
        if (response.estado === 'exito') {
          this.proyecto.set(response.respuesta);
        }
      },
      error: error => {
        console.error("Error al cargar proyecto:", error);
        alert("Error al cargar información del proyecto");
      }
    });
  }

  onCategoriaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const categoriaId = select.value;

    if (categoriaId) {
      this.loadProductosCategoria(categoriaId);
    } else {
      this.categoriaSeleccionada.set(null);
      this.products = [];
    }
  }

  loadProductosCategoria(categoriaId: string) {
    this.categoriasService.getById(categoriaId).subscribe({
      next: response => {
        this.categoriaSeleccionada.set(response);
        this.products = response.productos || [];
        console.log("Productos de la categoría:", this.products);
      },
      error: error => {
        console.error("Error al cargar productos de la categoría:", error);
        alert("Error al cargar productos");
      }
    });
  }


  onQuantityChange(product: IProductoFk, input: HTMLInputElement, checkbox: HTMLInputElement) {
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
        sp => sp.idProductoFk === product.idProductoFk
      );

      if (existingIndex !== -1) {
        this.selectedProducts[existingIndex].cantidad = quantity;
      } else {
        this.selectedProducts.push({
          idProductoFk: product.idProductoFk,
          cantidad: quantity
        });
      }
    } else {
      // Remove from selected products
      this.selectedProducts = this.selectedProducts.filter(
        sp => sp.idProductoFk !== product.idProductoFk
      );
    }
  }

  removeProduct(product: IProductoFk, checkbox: HTMLInputElement, input: HTMLInputElement) {
    // Uncheck checkbox
    checkbox.checked = false;

    // Clear input
    input.value = '';

    // Remove from selected products
    this.selectedProducts = this.selectedProducts.filter(
      sp => sp.idProductoFk !== product.idProductoFk
    );
  }

  close() {
    this.dialogRef.close();
  }

  closeWithRta() {
    this.dialogRef.close(this.selectedProducts);
  }
}
