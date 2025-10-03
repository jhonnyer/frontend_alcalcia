import { Component, inject, OnInit, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { IProducto, IProductoFk, ISelectedProduct } from '../../../../core/models/products.model';
import { ProductosService } from '../../../../core/services/productos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { CommonModule } from '@angular/common';
import { IProyecto, IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ICategorias } from '../../../../core/models/categorias.model';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

interface DialogData {
  idProyecto: number | null;
  productosSeleccionados?: ISelectedProduct[];
}

@Component({
  selector: 'app-products-list-select',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
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
  constructor(private dialog: MatDialog) {}

  // data = inject(DIALOG_DATA);
  data = inject<DialogData>(DIALOG_DATA);
  dialogRef = inject<DialogRef<ISelectedProduct[]>>(DialogRef<ISelectedProduct[]>);
  private productosService = inject(ProductosService);
  private categoriasService = inject(CategoriasService);
  private proyectosService = inject(ProyectosService);
  Math= Math;

  proyecto = signal<IProyectoAndCategoriaArray | null>(null);
  categoriaSeleccionada = signal<ICategorias | null>(null);
  products: IProductoFk[] = [];
  selectedProducts: ISelectedProduct[] = [];

  // Paginación
  pageIndex = 0;
  pageSize = 2; // Número de filas por página
  pageSizeOptions = [5, 10, 20];

  // Filtro de búsqueda
  searchTerm: string = '';

  ngOnInit(): void {
    if (this.data.idProyecto) {
      this.getProjectById();
      // ✅ Inicializar con productos seleccionados
      if (this.data.productosSeleccionados?.length) {
        this.selectedProducts = [...this.data.productosSeleccionados];
      }
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
      },
      error: error => {
        alert("Error al cargar productos");
      }
    });
  }


  onQuantityChange(product: IProductoFk, input: HTMLInputElement, checkbox: HTMLInputElement) {
    const quantity = Number(input.value);

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
    if (this.selectedProducts.length === 0) {
      return; // no debería entrar aquí porque el botón ya está disabled
    }

    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Desea agregar esta lista de productos?' }
    });

    confirmRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.dialogRef.close(this.selectedProducts);
      }
    });
  }


  get filteredProducts() {
    let filtered = this.products;

    // 🔎 Filtro por nombre o descripción
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombreProducto.toLowerCase().includes(term) ||
        (p.descripcion?.toLowerCase().includes(term))
      );
    }

    // 📄 Paginación
    const start = this.pageIndex * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  get totalFiltered() {
    let filtered = this.products;

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombreProducto.toLowerCase().includes(term) ||
        (p.descripcion?.toLowerCase().includes(term))
      );
    }

    return filtered.length;
  }

  // Cambiar página
  onPageChange(newIndex: number) {
    if (newIndex >= 0 && newIndex < Math.ceil(this.totalFiltered / this.pageSize)) {
      this.pageIndex = newIndex;
    }
  }

  // Cambiar tamaño de página
  onPageSizeChange(event: Event) {
    this.pageSize = +(event.target as HTMLSelectElement).value;
    this.pageIndex = 0; // reset
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProducts.some(sp => sp.idProductoFk === productId);
  }

  getProductQuantity(productId: number): number | '' {
    const found = this.selectedProducts.find(sp => sp.idProductoFk === productId);
    return found ? found.cantidad : '';
  }

}
