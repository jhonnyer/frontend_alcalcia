import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActasService } from '../../../../core/services/actas.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { IActaById } from '../../../../core/models/acta.model';
import { ISelectedProduct, ProductoWithCantidad } from '../../../../core/models/products.model';
import { Router } from '@angular/router';
import { DialogModule, Dialog } from '@angular/cdk/dialog';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { IResponsable } from '../../../../core/models/responsable.model';
import { ProductosService } from '../../../../core/services/productos.service';
import { ProductsListSelectComponent } from '../../components/products-list-select/products-list-select.component';

interface DialogData {
  idProyecto: number | null;
}

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

  private router = inject(Router);
  private dialog = inject(Dialog);
  private proyectosService = inject(ProyectosService);
  private responsibleService = inject(ResponsibleService);
  private productosService = inject(ProductosService);

  public formActa: FormGroup = new FormGroup({});

  proyectos = signal<IProyectoAndCategoriaArray[]>([]);
  responsables = signal<IResponsable[]>([]);
  selectedProductsInfo = signal<ProductoWithCantidad[]>([]);

  proyectoSelect = signal<number | null>(null);
  responsableActa = signal<number | null>(null);

  selectProyecto = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required]
  });

  selectResponsable = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required]
  });

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar Acta');
    console.log("ID Acta recibido:", this.idActa);
    this.initFormActa();
    this.loadActaData();
    this.getProyectos();
    this.getResponsables();
  }

  private initFormActa(): void {
    this.formActa = this.fb.group({
      fechaCreacion: [{value: '', disabled: true}, [Validators.required]],
      estado: [{value: '', disabled: true}, [Validators.required]],
      fechaEntrega: [''],
      ubicacionEntrega: ['', [Validators.required]],
      prioridad: ['', [Validators.required]],
      responsableVisita: ['', [Validators.required]],
      tipoSolicitud: ['', [Validators.required]],
      productos: [null],
      paquetes: [null],
      observaciones: ['']
    });
  }

  /*
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
  }*/

    private loadActaData(): void {
      this.loading.set(true);
      this.error.set(null);

      this.actasService.getById(this.idActa).subscribe({
        next: (response) => {
          if (response.estado === 'exito') {
            const acta = response.respuesta;
            this.actaData.set(acta);

            // Actualizar selecciones
            this.proyectoSelect.set(acta.proyecto.idProyecto);
            this.responsableActa.set(acta.responsable.idResponsable);
            this.selectProyecto.setValue(acta.proyecto.idProyecto.toString());
            this.selectResponsable.setValue(acta.responsable.idResponsable.toString());

            // Actualizar formulario
            this.formActa.patchValue({
              fechaCreacion: acta.fechaCreacion,
              estado: acta.estado,
              fechaEntrega: acta.fechaEntrega,
              ubicacionEntrega: acta.ubicacionEntrega,
              prioridad: acta.prioridad,
              responsableVisita: acta.responsableVisita,
              tipoSolicitud: acta.tiposSolicitud,
              observaciones: acta.observaciones
            });

            // Procesar productos si existen
            if (acta.detallesActaProductos?.length > 0) {
              const productos = acta.detallesActaProductos
                .filter(detalle => detalle.productos)
                .map(detalle => {
                  const producto = detalle.productos;
                  return {
                    idProducto: producto?.idProductoFk,
                    nombre: producto?.nombreProducto,
                    descripcion: producto?.descripcion || '',
                    stock: producto?.stock || 0,
                    fechaIngreso: producto?.fechaIngreso,
                    cantidad: producto?.cantidad || 0
                  } as ProductoWithCantidad;
                });

              this.selectedProductsInfo.set(productos);
            }

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

  getProyectos() {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        this.proyectos.set(response.respuesta);
      },
      error: error => {
        console.error("Error al cargar proyectos:", error);
      }
    });
  }

  getResponsables() {
    this.responsibleService.getAll().subscribe({
      next: response => {
        this.responsables.set(response);
      },
      error: error => {
        console.error("Error al cargar responsables:", error);
      }
    });
  }

  onChangesSelectProyecto() {
    this.selectProyecto.valueChanges.subscribe({
      next: value => {
        this.proyectoSelect.set(+value);
      }
    });
  }

  onChangesSelectResponsableActa() {
    this.selectResponsable.valueChanges.subscribe({
      next: value => {
        this.responsableActa.set(+value);
      }
    });
  }

  cancelar() {
    this.router.navigate(['proceedings']);
  }

  updateProductQuantity(product: number, event: Event){
    console.log("Productos actualizados:", this.selectedProductsInfo());
  }

    openDialog() {
      if (!this.proyectoSelect()) {
        alert('Por favor seleccione un proyecto primero');
        return;
      }
      const dialogRef = this.dialog.open<ISelectedProduct[]>(ProductsListSelectComponent, {
        data: {
          idProyecto: this.proyectoSelect()
        } as DialogData
      });

      dialogRef.closed.subscribe(selectedProducts => {
        if (selectedProducts && selectedProducts.length > 0) {
          // Actualizamos el formulario con los productos seleccionados
          this.formActa.patchValue({
            productos: selectedProducts
          });

          // Obtenemos la información completa de los productos
          this.productosService.getAll().subscribe({
            next: (allProducts) => {
              const productsWithQuantity: ProductoWithCantidad[] = selectedProducts
                .map(selected => {
                  const productInfo = allProducts.find(p => p.idProducto === selected.idProductoFk);
                  if (!productInfo) return null;

                  return {
                    ...productInfo,
                    cantidad: selected.cantidad
                  };
                })
                .filter((product): product is ProductoWithCantidad => product !== null);

              this.selectedProductsInfo.set(productsWithQuantity);
            },
            error: (error) => {
              console.error('Error al cargar información de productos:', error);
            }
          });
        }
      });
    }

  onSubmit() {
    if (this.formActa.valid) {
      const dataToUpdate = {
        ...this.formActa.value,
        idActa: this.idActa,
        proyecto: { idProyecto: this.proyectoSelect() },
        responsable: { idResponsable: this.responsableActa() },
        productos: this.selectedProductsInfo().map(p => ({
          idProductoFk: p.idProducto,
          cantidad: p.cantidad
        }))
      };

      this.actasService.update(dataToUpdate).subscribe({
        next: () => {
          console.log("Acta actualizada correctamente");
          this.router.navigate(['proceedings']);
        },
        error: error => {
          console.error("Error al actualizar:", error);
          alert("Error al actualizar el acta");
        }
      });
    } else {
      this.formActa.markAllAsTouched();
    }
  }

}
