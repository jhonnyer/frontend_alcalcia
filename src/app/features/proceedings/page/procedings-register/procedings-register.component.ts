import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductsListSelectComponent } from '../../components/products-list-select/products-list-select.component';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { PaquetesService } from '../../../../core/services/paquetes.service';
import { error } from 'console';

@Component({
  selector: 'app-procedings-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DialogModule
  ],
  styles: ``,
  templateUrl: './procedings-register.component.html'
})
export class ProcedingsRegisterComponent implements OnInit{
  public formFamilyCore: FormGroup = new FormGroup({});
  public searchFormProyecto: FormGroup = new FormGroup({});

  private fb = inject(FormBuilder);
  private dialog = inject(Dialog);
  private pageTitleService = inject(PageTitleService);



  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Registrar acta');
    this.initFormFamilyCore(); // Formulario del acta
    this.initSearchBeneficiarioForm(); // Formulario para buscar beneficiario

    this.getBeneficiarios();
    this.getProyectos();
    this.getResponsables();
    this.getProductos();
    this.getPaquetes();
  }

  /**PREVIO Inicio */

  private beneficiarioProyectoService = inject(BeneficiarioProyectoService)
  private proyectosService = inject(ProyectosService)
  private responsibleService = inject(ResponsibleService)
  private productosService = inject(ProductosService)
  private paquetesService = inject(PaquetesService)


  getBeneficiarios() {
    this.beneficiarioProyectoService.getAll().subscribe({
      next: response => {
        console.log("Beneficiarios: ", response)
      },
      error: error => {
        console.log("Error al traer beneficiarios")
      }
    });
  }

  getProyectos() {
    this.proyectosService.getAll().subscribe({
      next: response => {
        console.log("Proyectos", response)
      },
      error: error => {
        console.log("Error al traer proyectos")
      }
    });
  }

  getResponsables() {
    this.responsibleService.getAll().subscribe({
      next: response => {
        console.log("Responsables: ",response);
      },
      error: error => {
        console.log("Error al traer responsables")
      }
    });
  }

  getProductos() {
    this.productosService.getAll().subscribe({
      next: response => {
        console.log("Productos: ",response);
      },
      error: error => {
        console.log("Error al traer productos")
      }
    })
  }

  getPaquetes() {
    this.paquetesService.getAll().subscribe({
      next: response => {
        console.log("Paquetes: ",response)
      },
      error: error => {
        console.log("Error al traer los paquetes")
      }
    });
  }

  initSearchBeneficiarioForm(){
    this.searchFormProyecto = this.fb.group({
      searchInputProyecto: ['']
    });
  }



  searchTermProyecto: string = '';
  onSearchProyecto(event: any): void {
    console.log(this.searchTermProyecto)
    if (this.searchTermProyecto.trim()) {
    }
  }


  /**PREVIO FIN */
  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      proyecto: ['', [Validators.required]],
      responsableVisita: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      prioridad: ['', [Validators.required]],
      beneficiarios: this.fb.array([])
    });
    this.addBeneficiary();
  }

  initFormBeneficiary(): FormGroup {

    // Retorna el formulario que estará anidado
    return this.fb.group({
      nombre1: ['', [Validators.required]],
      nombre2: ['', [Validators.required]],
      apellido1: ['', [Validators.required]],
      apellido2: ['', [Validators.required]],
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      victimaConflico: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      edad: ['', [Validators.required]],
      etnia: ['', [Validators.required]],
      email: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
    });
  }

  //Agrega un nuevo formulario anidado de Persona
  addBeneficiary(): void {
    const refBeneficiary = this.formFamilyCore.get('beneficiarios') as FormArray;
    refBeneficiary.push(this.initFormBeneficiary());
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  get beneficiariosFormArray(): FormArray {
    return this.formFamilyCore.get('beneficiarios') as FormArray;
  }

  deletePerson(index: number): void {
    const beneficiariosArray = this.formFamilyCore.get('beneficiarios') as FormArray;
    beneficiariosArray.removeAt(index);
  }

  openDialog() {
    // const idProyecto = this.formFamilyCore.get('proyecto')
    const idProyecto = 2
    const dialogRef = this.dialog.open<string>(ProductsListSelectComponent, {
      data: {
        animal: 'perro',
      }
    });
    dialogRef.closed.subscribe(output => {
      console.log("Salida: ", output);
    })
  }


  onSubmit() {
    if(this.formFamilyCore.valid){
      console.log("Form Family Core");
      console.log(this.formFamilyCore.value);
	  }else{
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
