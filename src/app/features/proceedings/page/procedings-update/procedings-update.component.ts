import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActasService } from '../../../../core/services/actas.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { IActaById } from '../../../../core/models/acta.model';
import { ProductoWithCantidad } from '../../../../core/models/products.model';

@Component({
  selector: 'app-procedings-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './procedings-update.component.html'
})
export class ProcedingsUpdateComponent implements OnInit {
  @Input('id') idActa!: string;
  private actasService = inject(ActasService);

  private pageTitleService = inject(PageTitleService);
  private fb = inject(FormBuilder);

  // Signals para manejar el estado
  actaData = signal<IActaById | null>(null);
  productosActa = signal<ProductoWithCantidad[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);


  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar Acta');
    console.log("ID Acta recibido:", this.idActa);
    this.getActaById();
    this.loadActaData();
  }

  getActaById() {
    this.actasService.getById(this.idActa).subscribe({
      next: response => {
        console.log("Acta: ", response);
      },
      error: error => {
        console.log("Error al traer acta")
      }
    })
  }

  private loadActaData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.actasService.getById(this.idActa).subscribe({
      next: (response) => {
        if (response.estado === 'exito') {
          this.actaData.set(response.respuesta);

          if (response.respuesta.detallesActaProductos?.length > 0) {
            const productos = response.respuesta.detallesActaProductos
              .filter(detalle => detalle.productos) // Filtramos productos nulos
              .map(detalle => {
                const producto = detalle.productos;
                if (!producto) return null;

                return {
                  idProducto: producto.idProductoFk,
                  nombre: producto.nombreProducto,
                  descripcion: producto.descripcion || '',
                  stock: producto.stock || 0,
                  fechaIngreso: producto.fechaIngreso,
                  cantidad: producto.cantidad || 0
                } as ProductoWithCantidad;
              })
              .filter((producto): producto is ProductoWithCantidad => producto !== null);

            this.productosActa.set(productos);
          }

          console.log('Acta cargada:', response.respuesta);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error al cargar el acta:', error);
        this.error.set('Error al cargar los datos del acta');
        this.loading.set(false);
      }
    });
  }
  hasProducts(): boolean {
    return this.productosActa().length > 0;
  }

}
