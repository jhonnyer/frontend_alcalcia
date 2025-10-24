import { Component, inject, OnInit, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { IProductoFk, ISelectedProduct, ProductsDialogResult } from '../../../../core/models/products.model';
import { ProductosService } from '../../../../core/services/productos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { CommonModule } from '@angular/common';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ICategorias } from '../../../../core/models/categorias.model';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from '../../../../core/services/alert.service';

interface DialogData {
  idProyecto: number | null;
  productosSeleccionados?: ISelectedProduct[];
  idCategoriaSeleccionada?: number | null ;
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
  dialogRef = inject<DialogRef<ProductsDialogResult>>(DialogRef<ProductsDialogResult>);
  private categoriasService = inject(CategoriasService);
  private proyectosService = inject(ProyectosService);
  private alert = inject(AlertService);
  Math= Math;

  proyecto = signal<IProyectoAndCategoriaArray | null>(null);
  categoriaSeleccionada = signal<ICategorias | null>(null);
  products: IProductoFk[] = [];
  selectedProducts: ISelectedProduct[] = [];
  selectedCategoriaId = signal<number>(-1); // -1 = no seleccionada

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
      this.alert.warning('Alerta',"No se ha seleccionado un proyecto");
      this.close();
    }
  }

  getCategoryById(){
    if (this.data.idProyecto) {
      this.getProjectById();
    } else {
      this.alert.warning('Alerta',"No se ha seleccionado un proyecto");
      this.close();
    }
  }

  getProjectById() {
    this.proyectosService.getById(this.data.idProyecto!.toString()).subscribe({
      next: response => {
        if (response.estado === 'exito' && response.respuesta) {
          this.proyecto.set(response.respuesta);

          // Si viene del padre con categoría seleccionada
          let categoriaId = this.data.idCategoriaSeleccionada ?? null;

          if (categoriaId !== null) {
            this.selectedCategoriaId.set(categoriaId);

            const categoria = response.respuesta.categorias?.find(
              (c: ICategorias) => c.idCategoria === categoriaId
            );

            if (categoria) {
              this.categoriaSeleccionada.set(categoria);
              this.products = categoria.productos ?? [];
            }
          }else{
            // ❗️sin categoría => mostrar “Seleccione una categoría”
            this.selectedCategoriaId.set(-1);
            this.categoriaSeleccionada.set(null);
            this.products = [];
          }
        }
      },
      error: error => {
        console.error("Error al cargar proyecto:", error);
        this.alert.error("Error Servicio","Error al cargar información del proyecto");
      }
    });
  }

  onCategoriaChange(categoriaId: number | string) {
    const id = +categoriaId; // convertir siempre a number

    if (id === -1) {
      this.categoriaSeleccionada.set(null);
      this.products = [];
      this.selectedCategoriaId.set(-1); // 👈 aseguramos el valor en el signal
      return;
    }

    // Guardar en el signal
    this.selectedCategoriaId.set(id);

    // Buscar en el proyecto actual
    const categoria = this.proyecto()?.categorias?.find(
      c => c.idCategoria === id
    );

    if (categoria) {
      this.categoriaSeleccionada.set(categoria);
      this.products = categoria.productos ?? [];
    }
  }

  loadProductosCategoria(categoriaId: string) {
    this.categoriasService.getById(categoriaId).subscribe({
      next: response => {
        this.categoriaSeleccionada.set(response);
        this.products = response.productos || [];
      },
      error: error => {
        this.alert.error("Error Servicio","Error al cargar productos");
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
        this.dialogRef.close({
          productos: this.selectedProducts,
          categoriaId: this.categoriaSeleccionada()?.idCategoria ?? null
        });
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
