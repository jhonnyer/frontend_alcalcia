import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductsListSelectComponent } from '../../components/products-list-select/products-list-select.component';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { ActasService } from '../../../../core/services/actas.service';
import { IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';
import { debounceTime } from 'rxjs';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { IResponsable } from '../../../../core/models/responsable.model';
import { ISelectedProduct, ProductoWithCantidad, ProductsDialogResult } from '../../../../core/models/products.model';

import { Router } from '@angular/router';
import { IBeneficiarioProyecto } from '../../../../core/models/beneficiarioProyecto.model';
import { ConfirmDialogComponent } from '../../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from '../../../../core/services/alert.service';

interface DialogData {
  idProyecto: number | null;
  productosSeleccionados?: ISelectedProduct[];
  idCategoriaSeleccionada?: number | null;
}

@Component({
  selector: 'app-procedings-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    DialogModule,
    MatIconModule,
    FormsModule
  ],
  styles: ``,
  templateUrl: './procedings-register.component.html'
})
export class ProcedingsRegisterComponent implements OnInit{
  constructor(private dialogModal: MatDialog, private snackBar: MatSnackBar ) {}
  public formActa: FormGroup = new FormGroup({});
  // public searchFormProyecto: FormGroup = new FormGroup({});

  private fb = inject(FormBuilder);
  private dialog = inject(Dialog);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  private beneficiaryService = inject(BeneficiaryService);
  private alert = inject(AlertService);

  beneficiario = signal<IBeneficiarioUnique | null>(null);
  beneficiarioNoEncontrado: boolean = false;
  proyectoSelect = signal<number | null>(null);
  responsableActa = signal<number | null>(null);

  proyectos = signal<IProyectoAndCategoriaArray[]>([]);
  responsables = signal<IResponsable[]>([]);

  private productosService = inject(ProductosService);

  private beneficiarioProyectoService = inject(BeneficiarioProyectoService)
  private proyectosService = inject(ProyectosService)
  private responsibleService = inject(ResponsibleService)

  private actasService = inject(ActasService);

  selectedProductsInfo = signal<ProductoWithCantidad[]>([]);
  isSubmitting = false;

  // Lista completa de proyectos asociados al beneficiario
  beneficiariosProyecto = signal<IBeneficiarioProyecto[]>([]);
  proyectosActivosVisible = signal(false);

  // Proyecto seleccionado (uno solo)
  beneficiarioProyecto = signal<IBeneficiarioProyecto | null>(null);
  proyectoSeleccionadoId: number | null = null;

  searchBeneficiario = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required, // Campo obligatorio
      Validators.minLength(4), // Mínimo 4 caracteres
      Validators.maxLength(20), // Mínimo 20 caracteres
      Validators.pattern(/^[A-Za-z0-9-]+$/)  // ← acepta letras, números y guiones
    ],
  });

  selectProyecto = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required // Campo obligatorio
    ],
  });

  selectResponsable = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required // Campo obligatorio
    ],
  });

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Registrar acta');
    this.onSearchBeneficiario();
    this.onChangesSelectProyecto();
    this.onChangesSelectResponsableActa();
    this.initFormActa(); // Formulario del acta
    // this.getBeneficiarios();
    this.getProyectos();
    this.getResponsables();
  }

  @HostListener('window:beforeunload', ['$event'])
  protectPendingChanges(event: BeforeUnloadEvent): void {
    if (this.hasPendingChanges() && !this.isSubmitting) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  hasPendingChanges(): boolean {
    return !!this.beneficiario()
      || !!this.beneficiarioProyecto()
      || this.selectedProductsInfo().length > 0
      || this.formActa.dirty;
  }

  onSearchBeneficiario() {
    this.searchBeneficiario.valueChanges
      .pipe(debounceTime(400))
      .subscribe({
        next: (value: string) => {
          if (value.length >= 6) {
            this.beneficiarioNoEncontrado = false;

            this.beneficiarioProyectoService.getBeneficiarioProyectoByCedula(value).subscribe({
              next: resp => {
                if (resp && resp.length > 0) {
                  // 🔹 Guarda SIEMPRE la lista completa (activos e inactivos)
                  this.beneficiariosProyecto.set(resp);

                  // 🔹 Filtra los proyectos realmente activos (proyecto y beneficiario)
                  const activos = resp.filter(p => p.estadoProyecto === 'A' && p.esBeneficiarioActivo === true);

                  // 🟡 Si no hay proyectos activos → dejar visible el beneficiario y mostrar mensaje HTML
                  if (activos.length === 0) {
                    this.beneficiarioProyecto.set(resp[0]); // muestra el primero (aunque esté inactivo)
                    this.proyectoSelect.set(null);
                    this.proyectoSeleccionadoId = null;

                    this.formActa.patchValue({
                      idBeneficiario: null,
                      idProyecto: null
                    });

                    // 🔹 Cargar info del beneficiario
                    this.beneficiaryService.getByCedula(value).subscribe({
                      next: beneficiarioInfo => {
                        this.beneficiario.set(beneficiarioInfo);
                        this.beneficiarioNoEncontrado = false;
                      },
                      error: error => console.error('Error al obtener información del beneficiario:', error)
                    });

                    // ✅ el mensaje “No hay proyectos activos...” se mostrará desde el HTML
                    return;
                  }

                  // 🔹 Si hay proyectos activos → usa solo los activos
                  this.beneficiariosProyecto.set(activos);
                  this.proyectosActivosVisible.set(false);

                  // 🔹 Selecciona el más reciente
                  const seleccionado = activos.sort(
                    (a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
                  )[0];

                  // 🔹 Asigna valores al estado
                  this.beneficiarioProyecto.set(seleccionado);
                  this.proyectoSelect.set(seleccionado.idProyecto);
                  this.proyectoSeleccionadoId = seleccionado.idProyecto;

                  // 🔹 Parchea el formulario base
                  this.formActa.patchValue({
                    idBeneficiario: seleccionado.idBeneficiario,
                    idProyecto: seleccionado.idProyecto
                  });

                  // 🔹 Carga información del beneficiario
                  this.beneficiaryService.getByCedula(value).subscribe({
                    next: beneficiarioInfo => {
                      this.beneficiario.set(beneficiarioInfo);
                      this.beneficiarioNoEncontrado = false;
                    },
                    error: error => console.error('Error al obtener información del beneficiario:', error)
                  });
                } else {
                  // ⚠️ No hay proyectos asociados
                  this.resetFormularioCompleto();
                  this.handleBeneficiarioNoEncontrado();
                }
              },
              error: error => {
                this.resetFormularioCompleto();
                this.handleBeneficiarioNoEncontrado();
                console.error('Error en la búsqueda:', error);
              }
            });
          } else {
            // 🧹 Si el usuario borra el campo o escribe menos de 6 caracteres
            this.beneficiarioNoEncontrado = false;
            this.beneficiario.set(null);
            this.beneficiariosProyecto.set([]);
            this.beneficiarioProyecto.set(null);
            this.proyectoSelect.set(null);
            this.selectedProductsInfo.set([]);
            this.formActa.reset({
              fechaCreacion: this.getFechaActual(),
              estado: 'R'
            });
          }
        }
      });
  }


  resetFormularioCompleto() {
    // Limpia signals y variables
    this.beneficiario.set(null);
    this.beneficiariosProyecto.set([]);
    this.beneficiarioProyecto.set(null);
    this.proyectoSelect.set(null);
    this.responsableActa.set(null);
    this.selectedProductsInfo.set([]);
    this.proyectosActivosVisible.set(false);

    // Reinicia controles individuales
    this.selectResponsable.reset('');
    this.selectProyecto.reset('');

    // Reinicia formulario principal
    this.formActa.reset({
      fechaCreacion: this.getFechaActual(),
      estado: 'R',
      proyecto: null,
      responsable: null,
      productos: null,
      categoria: null,
      paquetes: null
    });

    // Muestra mensaje opcional
    this.snackBar.open('Formulario reiniciado por cambio de beneficiario', 'Cerrar', {
      duration: 2500,
      panelClass: ['snackbar-info']
    });
  }

  private handleBeneficiarioNoEncontrado() {
    this.beneficiarioNoEncontrado = true;
    this.beneficiariosProyecto.set([]);
    this.beneficiarioProyecto.set(null);
    this.beneficiario.set(null);
    this.formActa.patchValue({
      idBeneficiario: '',
      idProyecto: ''
    });
  }

  onChangesSelectProyecto(){
    this.selectProyecto.valueChanges.subscribe({
      next: value => {
        this.proyectoSelect.set(+value);
      }
    });
  }

  onChangesSelectResponsableActa(){
    this.selectResponsable.valueChanges.subscribe({
      next: value => {
        this.responsableActa.set(+value);
      }
    });
  }

  getProyectos() {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        this.proyectos.set(response.respuesta);
      },
      error: error => {
        console.log("Error al traer proyectos")
      }
    });
  }

  getResponsables() {
    this.responsibleService.getAll().subscribe({
      next: (response: IResponsable[]) => {
        // 🔹 Solo responsables activos
        const activos = response.filter(r => r.estado?.trim().toUpperCase() === 'A');
        this.responsables.set(activos);
      },
      error: (error) => {
        console.error('Error al traer responsables:', error);
      }
    });
  }


  initFormActa(): void {
    this.formActa = this.fb.group({
      fechaCreacion: [this.getFechaActual(), [Validators.required]],
      estado: ['R', [Validators.required]],
      fechaEntrega: [''],
      proyecto:     [{idProyecto: this.proyectoSelect()}],
      responsable: this.responsableActa()
      ? [{ idResponsable: this.responsableActa() }]
      : [null],
      ubicacionEntrega: ['', [Validators.required]],
      prioridad: ['', [Validators.required]],
      responsableVisita: ['', [Validators.required]],
      tipoSolicitud: ['', [Validators.required]],
      productos: [null],
      paquetes: [null],
      observaciones: [''],
      categoria: [null]  
    });
  }

  // Método para obtener la fecha actual en formato "YYYY-MM-DD"
  getFechaActual(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = (hoy.getMonth() + 1).toString().padStart(2, '0'); // Mes en formato 2 dígitos
    const day = hoy.getDate().toString().padStart(2, '0'); // Día en formato 2 dígitos
    return `${year}-${month}-${day}`;
  }

  openDialog() {
    if (!this.proyectoSelect()) {
      this.alert.warning('Alerta','Por favor seleccione un proyecto primero');
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

        // ✅ Guardar en el formulario
        this.formActa.patchValue({
          productos: productos,
          categoria: categoriaId
        });

        // ✅ Reconstruir los productos con info completa desde el servicio
        this.productosService.getAll().subscribe({
          next: (allProducts) => {
            const productsWithQuantity: ProductoWithCantidad[] = productos
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

  toggleProyectosActivos(): void {
    this.proyectosActivosVisible.update(visible => !visible);
  }


  removeSelectedProduct(productId: number) {
    // Remover del signal de información
    const updatedInfo = this.selectedProductsInfo().filter(p => p.idProducto !== productId);
    this.selectedProductsInfo.set(updatedInfo);

    // Remover del formulario
    const currentProducts = this.formActa.get('productos')?.value || [];
    const updatedProducts = currentProducts.filter((p: ISelectedProduct) => p.idProductoFk !== productId);
    this.formActa.patchValue({
      productos: updatedProducts
    });
  }

  cancelar() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['proceedings']);
      return;
    }

    const confirmRef = this.dialogModal.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Deseas cancelar el registro? Los datos ingresados se perderán.' }
    });

    confirmRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.isSubmitting = false;
        this.formActa.reset();
        this.router.navigate(['proceedings']);
      }
    });
  }

  onSubmit() {
    if (this.isSubmitting) return;

    if (this.formActa.invalid) {
      this.formActa.markAllAsTouched();
      this.snackBar.open('⚠️ Formulario no válido. Revisa los campos.', 'Cerrar', { duration: 3000 });
      return;
    }

    // 🟢 Confirmación antes de enviar
    const confirmRef = this.dialogModal.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Desea registrar esta acta?' }
    });

    confirmRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;

      this.isSubmitting = true;

      // Sincronizar productos seleccionados antes de enviar
      const productosSeleccionados = this.selectedProductsInfo().map(p => ({
        idProductoFk: p.idProducto,
        cantidad: p.cantidad
      }));

      this.formActa.patchValue({ productos: productosSeleccionados });


      // Arma el payload
      const payload = {
        ...this.formActa.value,
        beneficiario: { idBeneficiario: this.beneficiario()?.idBeneficiario },
        proyecto:     { idProyecto: this.proyectoSelect() },
        responsable:  { idResponsable: this.responsableActa() }
      };

      this.actasService.post(payload).subscribe({
        next: resp => {
          this.snackBar.open('✅ Acta registrada correctamente', 'Cerrar', { duration: 3000 });
          const idActa = resp?.respuesta?.idActa;
          // Redirigir al formulario de actualización
          if (idActa) {
            this.router.navigate([`/proceedings/update/${idActa}`]);
          } else {
            // Si el backend no devuelve el id, fallback a listado
            this.router.navigate(['/proceedings']);
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.snackBar.open('❌ Algo salió mal, intenta de nuevo', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }

  updateProductQuantity(productId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value);

    // Validar que la cantidad sea válida
    if (isNaN(newQuantity) || newQuantity < 1) {
      this.alert.warning('Alerta','La cantidad debe ser mayor a 0');
      input.value = this.selectedProductsInfo().find(product => product.idProducto === productId)?.cantidad.toString() ?? '1';
      return;
    }

    // Actualizar cantidad en el signal
    const updatedProducts = this.selectedProductsInfo().map(product => {
      if (product.idProducto === productId) {
        // Validar contra el stock
        if (newQuantity > product.stock) {
          this.alert.warning('Alerta',`No hay suficiente stock. Stock disponible: ${product.stock}`);
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

  onProyectoSeleccionado(eventOrId: Event | number) {
    let idProyecto: number;

    // Si viene del select, es string o number
    if (typeof eventOrId === 'string' || typeof eventOrId === 'number') {
      idProyecto = Number(eventOrId);
    } else {
      // Si viene de un click de tabla (Event)
      idProyecto = Number((eventOrId.target as HTMLSelectElement).value);
    }

    const proyectoSeleccionado = this.beneficiariosProyecto().find(p => p.idProyecto === idProyecto);
    if (!proyectoSeleccionado) return;

    // 🔄 sincroniza todo
    this.proyectoSeleccionadoId = idProyecto;              // select
    this.proyectoSelect.set(idProyecto);                    // signal para form
    this.beneficiarioProyecto.set(proyectoSeleccionado);    // detalle visible

    this.formActa.patchValue({
      idProyecto: proyectoSeleccionado.idProyecto,
      idBeneficiario: proyectoSeleccionado.idBeneficiario
    });
  }

  getProyectosActivos(): IBeneficiarioProyecto[] {
    // 1️⃣ Filtra solo los proyectos activos y con beneficiario activo
    const activos = this.beneficiariosProyecto().filter(p =>
      p.estadoProyecto?.trim().toUpperCase() === 'A' && p.esBeneficiarioActivo === true
    );

    // 2️⃣ Agrupa por idProyecto y deja el más reciente (fechaInicio más reciente)
    const unicos = new Map<number, IBeneficiarioProyecto>();

    for (const p of activos) {
      const existente = unicos.get(p.idProyecto);
      if (!existente) {
        unicos.set(p.idProyecto, p);
      } else {
        // si hay más de uno, conserva el de inicio más reciente
        const fechaExistente = new Date(existente.fechaInicio);
        const fechaActual = new Date(p.fechaInicio);
        if (fechaActual > fechaExistente) {
          unicos.set(p.idProyecto, p);
        }
      }
    }
    // 3️⃣ Devuelve el arreglo limpio
    return Array.from(unicos.values());
  }

  tieneProyectosActivos(): boolean {
    return this.getProyectosActivos().length > 0;
  }

  // Detecta si un proyecto está "activo" sin importar cómo venga el estado
  esProyectoActivo(p: IBeneficiarioProyecto): boolean {
    const v: any = p.estadoProyecto;

    if (typeof v === 'string') {
      const s = v.trim().toUpperCase();
      // Ajusta según tus estados reales si hace falta
      return s === 'A' || s === 'ACTIVO' || s === 'EN_CURSO';
    }

    if (typeof v === 'number') {
      // Si usas enum numérico, compara contra el valor del enum si lo tienes importado
      // return v === EstadoProyecto.ACTIVO;
      // Fallback seguro (si tu enum marca activo como truthy distinto de 0)
      return v !== 0;
    }

    // Fallback si llegara boolean
    return !!v;
  }

}
