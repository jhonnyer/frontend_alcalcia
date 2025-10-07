import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
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
    MatIconModule
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

  beneficiarioProyecto = signal<IBeneficiarioProyecto | null>(null);


  searchBeneficiario = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required, // Campo obligatorio
      Validators.minLength(6), // Mínimo 6 caracteres
      Validators.maxLength(14), // Mínimo 14 caracteres
      Validators.pattern(/^\d+$/) // Solo números
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

  onSearchBeneficiario() {
    this.searchBeneficiario.valueChanges
      .pipe(debounceTime(400))
      .subscribe({
        next: (value: string) => {
          if (value.length >= 6) {
            // Buscar beneficiario
            this.beneficiarioNoEncontrado = false; 
            this.beneficiarioProyectoService.getBeneficiarioProyectoByCedula(value).subscribe({
              next: resp => {
                if (resp) {
                  this.beneficiarioProyecto.set(resp);

                  // Asigna IDs
                  this.formActa.patchValue({
                    idBeneficiario: resp.idBeneficiario,
                    idProyecto: resp.idProyecto
                  });
                  this.proyectoSelect.set(+resp.idProyecto);

                  // Carga la info del beneficiario
                  this.beneficiaryService.getByCedula(value).subscribe({
                    next: beneficiarioInfo => {
                      this.beneficiario.set(beneficiarioInfo);
                      this.beneficiarioNoEncontrado = false;
                    },
                    error: error => console.error('Error al obtener información del beneficiario:', error)
                  });
                } else {
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
            // Si el usuario borra el campo o escribe menos de 6 caracteres
            this.resetFormularioCompleto();
          }
        }
      });
  }

  private resetFormularioCompleto() {
    // Limpia signals y variables
    this.beneficiario.set(null);
    this.beneficiarioProyecto.set(null);
    this.proyectoSelect.set(null);
    this.responsableActa.set(null);
    this.selectedProductsInfo.set([]);

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
      next: response => {
        this.responsables.set(response);
      },
      error: error => {
        console.log("Error al traer responsables")
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

  cancelar(){
    this.formActa.reset();
    this.router.navigate(['proceedings']);
  }

  onSubmit() {
    console.log("ID Beneficiario: ", this.beneficiario()?.idBeneficiario);

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
          this.snackBar.open('❌ Algo salió mal, intenta de nuevo', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }

}
