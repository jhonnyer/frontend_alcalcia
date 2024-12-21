import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ICategorias } from './../../../../core/models/categorias.model';
import { IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';

@Component({
  selector: 'app-inventory-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styles: ``,
  templateUrl: './inventory-create.component.html'
})
export class InventoryCreateComponent implements OnInit {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private pageTitleService = inject(PageTitleService);
  private proyectosService = inject(ProyectosService);
  private productosService = inject(ProductosService);

  // Usamos IProyectoAndCategoriaGetId que ya incluye la estructura correcta
  proyectos = signal<IProyectoAndCategoriaArray[]>([]);
  categoriasDisponibles = signal<ICategorias[]>([]);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Agregar producto');
    this.initFormFamilyCore();
    this.loadProyectos();
  }

  loadProyectos(): void {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        if (response.estado === 'exito') {
          this.proyectos.set(response.respuesta);
        }
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        alert('Error al cargar los proyectos');
      }
    });
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      idProyecto: ['', [Validators.required]],
      idCategoria: [{ value: '', disabled: true }, [Validators.required]],
      productos: this.fb.array([], [Validators.required, Validators.min(1)])
    });

    // Escuchar cambios en la selección de proyecto
    this.formFamilyCore.get('idProyecto')?.valueChanges.subscribe(idProyecto => {
      this.onProyectoChange(idProyecto);
    });

    this.addProducts();
  }

  onProyectoChange(idProyecto: string): void {
    const proyectoSeleccionado = this.proyectos().find(
      p => p.proyecto.idProyecto === Number(idProyecto)
    );

    if (proyectoSeleccionado) {
      // Actualizar categorías disponibles
      this.categoriasDisponibles.set(proyectoSeleccionado.categorias);

      // Habilitar el select de categorías
      const categoriaControl = this.formFamilyCore.get('idCategoria');
      categoriaControl?.enable();
      categoriaControl?.setValue(''); // Resetear la selección
    } else {
      // Si no hay proyecto seleccionado, deshabilitar y limpiar categorías
      this.categoriasDisponibles.set([]);
      const categoriaControl = this.formFamilyCore.get('idCategoria');
      categoriaControl?.disable();
      categoriaControl?.setValue('');
    }
  }

  initFormProducts(): FormGroup {
    // Retorna el formulario que estará anidado
    return this.fb.group({
      nombreProducto: ['', [Validators.required]],
      stock: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      fechaIngreso: [null]
    });
  }

  //Agrega un nuevo formulario anidado de Persona
  addProducts(): void {
    const refProducts = this.formFamilyCore.get('productos') as FormArray;
    refProducts.push(this.initFormProducts());
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  get productosFormArray(): FormArray {
    return this.formFamilyCore.get('productos') as FormArray;
  }

  deleteProduct(index: number): void {
    const productosArray = this.formFamilyCore.get('productos') as FormArray;
    productosArray.removeAt(index);
  }


  onSubmit() {
    if(this.formFamilyCore.valid){
      // this.formFamilyCore.get('idProyecto')?.setValue(Number(this.formFamilyCore.get('idProyecto')?.value));
      this.formFamilyCore.value.idProyecto = Number(this.formFamilyCore.value.idProyecto);
      this.formFamilyCore.value.idCategoria = Number(this.formFamilyCore.value.idCategoria);
      console.log("Form");
      console.log(this.formFamilyCore.value);

      this.productosService.post(this.formFamilyCore.value).subscribe({
        next: response => {
          console.log("Producto creado: ", response);
          alert('Producto creado correctamente');
        },
        error: error => {
          console.log("Error: ", error);
          alert('Error al crear el producto');
        }
      });

	  }else{
      console.log('Formulario inválido');
      // this.formFamilyCore.get('idProyecto')?.setValue(Number(this.formFamilyCore.get('idProyecto')?.value));
      this.formFamilyCore.value.idProyecto = Number(this.formFamilyCore.value.idProyecto);
      this.formFamilyCore.value.idCategoria = Number(this.formFamilyCore.value.idCategoria);

      console.log(this.formFamilyCore.value);
		  this.formFamilyCore.markAllAsTouched();
      alert('Formulario inválido, revisa los campos');
	  }
  }
}
