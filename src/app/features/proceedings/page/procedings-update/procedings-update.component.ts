import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActasService } from '../../../../core/services/actas.service';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { EstadoActa, EstadoTransition, IActaById } from '../../../../core/models/acta.model';
import { ISelectedProduct, ProductoWithCantidad, ProductsDialogResult } from '../../../../core/models/products.model';
import { Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { IResponsable } from '../../../../core/models/responsable.model';
import { ProductosService } from '../../../../core/services/productos.service';
import { ProductsListSelectComponent } from '../../components/products-list-select/products-list-select.component';
import { MatIconModule } from '@angular/material/icon';

interface DialogData {
  idProyecto: number | null;
  productosSeleccionados?: ISelectedProduct[];
  idCategoriaSeleccionada?: number | null;
}

interface ProductoWithCantidadUpdate extends ProductoWithCantidad {
  isExisting: boolean;
}

@Component({
  selector: 'app-procedings-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  styles: ``,
  templateUrl: './procedings-update.component.html'
})
export class ProcedingsUpdateComponent implements OnInit {
  @Input('id') idActa!: string;
  private actasService = inject(ActasService);

  private pageTitleService = inject(PageTitleService);
  private fb = inject(FormBuilder);
  productosSoloLectura = signal(false);

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
  // selectedProductsInfo = signal<ProductoWithCantidad[]>([]);
  selectedProductsInfo = signal<ProductoWithCantidadUpdate[]>([]);

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

  // Estados para la transición
  // Agregar estas propiedades a la clase del componente
  estadosPermitidos = signal<EstadoTransition[]>([]);
  estadoInicialActa = signal<EstadoActa | null>(null);
  readonly ESTADOS_FINALES: EstadoActa[] = ['RC', 'E']; // Estados que no permiten actualización
  formularioEditable = signal<boolean>(true);
  readonly ESTADO_DEFAULT: EstadoActa = 'R';

  readonly ESTADOS_LABELS = {
    'R': 'Recibido',
    'P': 'Procesado',
    'A': 'Autorizado',
    'RC': 'Rechazado',
    'E': 'Entregado'
  };

  private readonly TRANSICIONES: Record<EstadoActa, EstadoTransition[]> = {
    'R': [{ label: 'Procesado', value: 'P' }],
    'P': [
      { label: 'Autorizado', value: 'A'},
      { label: 'Rechazado', value: 'RC' }
    ],
    'A': [{ label: 'Entregado', value: 'E' }],
    'RC': [], // No hay más transiciones posibles
    'E': []  // Estado final
  };

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar Acta');
    this.initFormActa();
    this.formActa.get('estado')?.valueChanges.subscribe((nuevoEstado) => {
      const observacionesCtrl = this.formActa.get('observaciones');
      // Permitir escribir observaciones solo si el acta NO está cerrada
      const estadoInicial = this.estadoInicialActa();

      // Si el acta ya está cerrada (RC o E), mantener bloqueado
      if (estadoInicial === 'RC' || estadoInicial === 'E') {
        observacionesCtrl?.disable({ emitEvent: false });
        return;
      }

      // Si cambia a RC o E (rechazado o entregado), permitir escribir observaciones
      if (nuevoEstado === 'RC' || nuevoEstado === 'E') {
        observacionesCtrl?.enable({ emitEvent: false });
      } else {
        // En cualquier otro estado (R, P, A), también permitir escribir
        observacionesCtrl?.enable({ emitEvent: false });
      }
    });

    this.loadActaData();
    this.getProyectos();
    this.getResponsables();
  }

  private initFormActa(): void {
    this.formActa = this.fb.group({
      fechaCreacion: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      fechaEntrega: [''],
      beneficiario: ['', [Validators.required]], // Agregar beneficiario como campo disabled
      proyecto: ['', [Validators.required]], // Agregar proyecto
      responsable: ['', [Validators.required]], // Agregar responsable
      ubicacionEntrega: ['', [Validators.required]],
      prioridad: ['', [Validators.required]],
      responsableVisita: ['', [Validators.required]],
      tipoSolicitud: ['', [Validators.required]],
      productos: [null],
      paquetes: [null],
      observaciones: [''],
      categoria: [null]  
    });

    // Listener para el campo estado
    this.formActa.get('estado')?.valueChanges.subscribe(estado => {
      this.updateProductosValidators(estado);
    });
  }

  private updateProductosValidators(estado: string): void {
    const productosControl = this.formActa.get('productos');

    if (estado === 'A') { // Si el estado es Autorizado
      // Actualizamos el valor del control con los productos actuales para activar submit
      const currentProducts = this.selectedProductsInfo().map(p => ({
        idProductoFk: p.idProducto,
        cantidad: p.cantidad
      }));

      productosControl?.setValue(currentProducts);
      productosControl?.addValidators([
        Validators.required,
        this.productosArrayValidator()
      ]);
    } else {
      productosControl?.clearValidators();
    }

    productosControl?.updateValueAndValidity();
  }

  private productosArrayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const productos = control.value;
      const selectedProducts = this.selectedProductsInfo();

      // Validamos usando tanto el control como el signal
      if ((!productos || !Array.isArray(productos) || productos.length === 0) &&
          selectedProducts.length === 0) {
        return { requiredProducts: true };
      }
      return null;
    };
  }

  // Estados permitidos
  private actualizarEstadosPermitidos(estado: EstadoActa): void {
    const transicionesDisponibles = this.TRANSICIONES[estado];

    // Filtrar transiciones basadas en productos si es necesario
    const transicionesFiltradas = transicionesDisponibles.filter(transicion => {
      if (transicion.requiereProductos) {
        return this.selectedProductsInfo().length > 0;
      }
      return true;
    });

    // Agregar el estado actual y sus transiciones permitidas
    const estadosPermitidos = [
      { label: this.ESTADOS_LABELS[estado], value: estado },
      ...transicionesFiltradas
    ];

    this.estadosPermitidos.set(estadosPermitidos);
  }

  // Modificar el método de validación
  private validarTransicionEstado(estadoActual: EstadoActa, nuevoEstado: EstadoActa): boolean {
    // Validar que la transición sea permitida
    const transicionesPermitidas = this.TRANSICIONES[estadoActual];
    // Seleccionar opciones validas
    const transicionValida = transicionesPermitidas.some(t => t.value === nuevoEstado);

    if (!transicionValida) {
      alert('Transición de estado no permitida');
      return false;
    }

    // Verificar requisitos adicionales
    const transicion = transicionesPermitidas.find(t => t.value === nuevoEstado);
    if (transicion?.requiereProductos && this.selectedProductsInfo().length === 0) {
      alert('Se requieren productos para cambiar a este estado');
      return false;
    }

    return true;
  }

  // Cargo los datos del acta
  private loadActaData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.actasService.getById(this.idActa).subscribe({
      next: (response) => {
        if (response.estado === 'exito') {
          const acta = response.respuesta;
          this.actaData.set(acta);

          // Verificar si el acta es editable
          const esEditable = !this.ESTADOS_FINALES.includes(acta.estado);
          this.formularioEditable.set(esEditable);
          // Si no es editable, deshabilitar todo el formulario
          if (!esEditable) {
            this.formActa.disable();
            this.selectProyecto.disable();
            this.selectResponsable.disable();
          }
          else {
            this.formActa.get('observaciones')?.enable();
          }


          // Verificar si se puede cambiar los valores de los productos
          const soloLectura = acta.estado === 'A' || acta.estado === 'E' || acta.estado === 'RC';
          this.productosSoloLectura.set(soloLectura);


          // Cargar el estado inicial del acta
          this.estadoInicialActa.set(acta.estado);
          // Actualizar estados permitidos basados en el estado inicial
          this.actualizarEstadosPermitidos(acta.estado);
          // Cargar las opciones de estado una sola vez
          this.cargarOpcionesEstado(acta.estado);

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
            beneficiario: { idBeneficiario: acta.beneficiario.idBeneficiario },
            proyecto: { idProyecto: acta.proyecto.idProyecto },
            responsable: { idResponsable: acta.responsable.idResponsable },
            ubicacionEntrega: acta.ubicacionEntrega,
            prioridad: acta.prioridad,
            responsableVisita: acta.responsableVisita,
            tipoSolicitud: acta.tipoSolicitud,
            observaciones: acta.observaciones,
            productos: acta.detallesActaProductos?.map(detalle => ({
              idProductoFk: detalle.productos?.idProductoFk,
              cantidad: detalle.productos?.cantidad
            })) || null,
            paquetes: null
          });

          // Después de hacer patchValue(...)
          const obsCtrl = this.formActa.get('observaciones');

          // Si el acta no está cerrada, asegurar que esté habilitado
          if (!this.ESTADOS_FINALES.includes(acta.estado)) {
            obsCtrl?.enable({ emitEvent: false });
          } else {
            obsCtrl?.disable({ emitEvent: false });
          }

          // Forzar actualización visual del control
          obsCtrl?.updateValueAndValidity();

          // Forzar re-enlace del control de observaciones después de habilitarlo
          setTimeout(() => {
            const obsCtrl = this.formActa.get('observaciones');
            if (obsCtrl && obsCtrl.enabled) {
              obsCtrl.setValue(obsCtrl.value || '');
            }
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
                  cantidad: producto?.cantidad || 0,
                  isExisting: true // Marcar como existente
                } as ProductoWithCantidadUpdate;
              });

            this.selectedProductsInfo.set(productos);
          }
          this.loading.set(false);
          this.actualizarEstadosPermitidos(acta.estado); // Validar
        }
      },
      error: (error) => {
        console.error('Error al cargar el acta:', error);
        this.error.set('Error al cargar los datos del acta');
        this.loading.set(false);
      }
    });
  }

  private cargarOpcionesEstado(estadoInicial: EstadoActa): void {
    const transicionesDisponibles = this.TRANSICIONES[estadoInicial];

    // Filtrar transiciones basadas en productos si es necesario
    const transicionesFiltradas = transicionesDisponibles.filter(transicion => {
      if (transicion.requiereProductos) {
        return this.selectedProductsInfo().length > 0;
      }
      return true;
    });

    // Crear lista de estados permitidos (estado actual + transiciones posibles)
    const estadosPermitidos = [
      { label: this.ESTADOS_LABELS[estadoInicial], value: estadoInicial },
      ...transicionesFiltradas
    ];

    // Establecer las opciones una sola vez
    this.estadosPermitidos.set(estadosPermitidos);
  }

  //Verifica si el acta tiene productos asociados
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

  updateProductQuantity(productId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value);

    // Validar que la cantidad sea válida
    if (isNaN(newQuantity) || newQuantity < 1) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    // Actualizar cantidad en el signal
    const updatedProducts = this.selectedProductsInfo().map(product => {
      if (product.idProducto === productId) {
        // Validar contra el stock
        if (newQuantity > product.stock) {
          alert(`No hay suficiente stock. Stock disponible: ${product.stock}`);
          input.value = product.cantidad.toString();
          return product;
        }
        return { ...product, cantidad: newQuantity };
      }
      return product;
    });

    this.selectedProductsInfo.set(updatedProducts);

    // Actualizar en el formulario
    const formProducts = updatedProducts.map(p => ({
      idProductoFk: p.idProducto,
      cantidad: p.cantidad
    }));

    this.formActa.patchValue({
      productos: formProducts
    });
  }

  openDialog() {
    const estadoActual = this.formActa.get('estado')?.value as EstadoActa;

    // Permitir solo en estados Recibido (R) y Procesado (P)
    if (!(estadoActual === 'R' || estadoActual === 'P')) {
      alert('Solo puede modificar productos en estados Recibido o Procesado');
      return;
    }

    if (!this.proyectoSelect()) {
      alert('Por favor seleccione un proyecto primero');
      return;
    }

    const dialogRef = this.dialog.open<ProductsDialogResult>(ProductsListSelectComponent, {
      data: {
        idProyecto: this.proyectoSelect(),
        productosSeleccionados: this.selectedProductsInfo().map(p => ({
          idProductoFk: p.idProducto,
          cantidad: p.cantidad
        })),
        idCategoriaSeleccionada: this.formActa.get('categoria')?.value
      } as DialogData
    });

    dialogRef.closed.subscribe((result: ProductsDialogResult | undefined) => {
      if (result && result.productos.length > 0) {
        const { productos, categoriaId } = result;

        this.productosService.getAll().subscribe({
          next: (allProducts) => {
            const productsWithQuantity: ProductoWithCantidadUpdate[] = productos
              .map(selected => {
                const productInfo = allProducts.find(p => p.idProducto === selected.idProductoFk);
                if (!productInfo) return null;

                return {
                  ...productInfo,
                  cantidad: selected.cantidad,
                  isExisting: false // Marcar como nuevo
                };
              })
              .filter((product): product is ProductoWithCantidadUpdate => product !== null);

            this.selectedProductsInfo.set(productsWithQuantity);

            // Actualizar formulario con productos y categoría
            this.formActa.patchValue({
              productos: productsWithQuantity.map(p => ({
                idProductoFk: p.idProducto,
                cantidad: p.cantidad
              })),
              categoria: categoriaId // 👈 aquí guardamos la categoría seleccionada
            });

            // Forzar revalidación si el estado es 'A'
            if (this.formActa.get('estado')?.value === 'A') {
              this.formActa.get('productos')?.updateValueAndValidity();
            }
          },
          error: (error) => {
            console.error('Error al cargar información de productos:', error);
          }
        });
      }
    });
  }

  // Agregar método para remover solo productos nuevos
  removeSelectedProduct(productId: number) {
    const estadoActual = this.formActa.get('estado')?.value as EstadoActa;

    // Solo permitir eliminar productos si el acta está en R o P
    if (!(estadoActual === 'R' || estadoActual === 'P')) {
      alert('No se pueden eliminar productos en el estado actual del acta');
      return;
    }

    const productoAEliminar = this.selectedProductsInfo().find(p => p.idProducto === productId);

    // Si no se encuentra, salir
    if (!productoAEliminar) return;

    // Confirmar eliminación
    const confirmar = confirm(`¿Desea eliminar el producto "${productoAEliminar.nombre}" del acta?`);
    if (!confirmar) return;

    // Eliminar del signal
    const updatedList = this.selectedProductsInfo().filter(p => p.idProducto !== productId);
    this.selectedProductsInfo.set(updatedList);

    // Actualizar el form control
    this.formActa.patchValue({
      productos: updatedList.map(p => ({
        idProductoFk: p.idProducto,
        cantidad: p.cantidad
      }))
    });

    // 🔥 Marcar producto como "eliminado" para persistir el cambio
    // (solo si venía de la BD)
    if (productoAEliminar.isExisting) {
      if (!this.formActa.get('paquetes')?.value) this.formActa.patchValue({ paquetes: [] });
      const eliminados = this.formActa.get('paquetes')?.value || [];
      eliminados.push({ idProductoFk: productId, eliminado: true });
      this.formActa.patchValue({ paquetes: eliminados });
    }

    console.log('🗑️ Producto eliminado:', productoAEliminar);
  }


  // Descargar pdf
  downloadPdf() {
    if (!this.idActa) return;

    this.actasService.getPdfActaById(this.idActa).subscribe({
      next: (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);

        // Crear elemento a temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = `Acta_${this.idActa}.pdf`;

        // Simular click para descargar
        document.body.appendChild(link);
        link.click();

        // Limpieza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: error => {
        console.error('Error al descargar el PDF:', error);
        alert('Error al descargar el PDF del acta');
      }
    });
  }

  cancelar() {
    this.router.navigate(['proceedings']);
  }

  onSubmit() {
    if (this.formActa.valid) {
      const nuevoEstado = this.formActa.get('estado')?.value as EstadoActa;
      const productos = this.selectedProductsInfo();

      if (nuevoEstado === 'A' && (!productos || productos.length === 0)) {
        alert('Debe seleccionar al menos un producto cuando el estado es Autorizado');
        return;
      }

      if (nuevoEstado === this.estadoInicialActa()) {
        alert('Debe cambiar el estado del acta para actualizarla');
        return;
      }

      if (!this.validarTransicionEstado(this.estadoInicialActa()!, nuevoEstado)) {
        return;
      }

      // Sincronizar observaciones manualmente
      const obsCtrl = this.formActa.get('observaciones');
      const textareaEl = document.getElementById('observaciones') as HTMLTextAreaElement;
      if (obsCtrl && textareaEl) {
        const currentValue = textareaEl.value?.trim() || '';
        obsCtrl.setValue(currentValue);
      }

      const formValues = this.formActa.getRawValue();

      const dataToUpdate = {
        ...formValues,
        idActa: Number(this.idActa),
        proyecto: { idProyecto: this.proyectoSelect() },
        responsable: { idResponsable: this.responsableActa() },
        productos: this.selectedProductsInfo().map(p => ({
          idProductoFk: p.idProducto,
          cantidad: p.cantidad
        }))
      };


      this.actasService.update(dataToUpdate).subscribe({
        next: () => {
          alert("✅ Acta actualizada con éxito");
          this.router.navigate([`proceedings/update/${this.idActa}`]).then(() => {
            window.location.reload();
          });
        },
        error: error => {
          console.error("❌ Error al actualizar:", error);
          alert("Error al actualizar el acta: " + error.mensaje);
        }
      });
    } else {
      this.formActa.markAllAsTouched();
    }
  }

}
