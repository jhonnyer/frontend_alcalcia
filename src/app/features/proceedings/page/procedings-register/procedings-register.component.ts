import { Component, EventEmitter, inject, OnInit, Output, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductsListSelectComponent } from '../../components/products-list-select/products-list-select.component';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

import { BeneficiarioProyectoService } from '../../../../core/services/beneficiarioProyecto.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { ProyectosService } from '../../../../core/services/proyectos.service';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { PaquetesService } from '../../../../core/services/paquetes.service';
import { ActasService } from '../../../../core/services/actas.service';
import { IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';
import { debounceTime } from 'rxjs';
import { timer } from 'rxjs';
import { IProyecto, IProyectoAndCategoriaArray } from '../../../../core/models/proyecto.model';
import { IResponsable } from '../../../../core/models/responsable.model';
import { ISelectedProduct } from '../../../../core/models/products.model';

import { Router } from '@angular/router';

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


  private beneficiarioProyectoService = inject(BeneficiarioProyectoService)
  private proyectosService = inject(ProyectosService)
  private responsibleService = inject(ResponsibleService)

  private actasService = inject(ActasService);

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

  onSearchBeneficiario(){
    this.searchBeneficiario.valueChanges
    .pipe(
      debounceTime(400)
    )
    .subscribe({
      next: (value:string) => {
        if(value.length >= 6 ){
          this.beneficiaryService.getByCedula(value).subscribe({
            next: resp => {
              if(resp !== undefined){
                this.beneficiario.set(resp);
                console.log("Llamado exitoso", resp)
              }else{
                this.beneficiarioNoEncontrado = true;
                this.beneficiario.set(null);
                timer(1500).subscribe(() => {
                  this.beneficiarioNoEncontrado = false;
                })
              }
              // alert(resp)
            },
            error: error => {
              this.beneficiarioNoEncontrado = true;
              this.beneficiario.set(null);
              timer(2500).subscribe(() => {
                this.beneficiarioNoEncontrado = false;
              })
              console.log(error)
            }
          })
        }
        console.log(value)
      }
    });
  }

  onChangesSelectProyecto(){
    this.selectProyecto.valueChanges.subscribe({
      next: value => {
        console.log("Proyecto: ", value);
        this.proyectoSelect.set(+value);
      }
    });
  }

  onChangesSelectResponsableActa(){
    this.selectResponsable.valueChanges.subscribe({
      next: value => {
        console.log("Responsable: ", value);
        this.responsableActa.set(+value);
      }
    });
  }

  // getBeneficiarios() {
  //   this.beneficiarioProyectoService.getAll().subscribe({
  //     next: response => {
  //       console.log("Beneficiarios: ", response)
  //     },
  //     error: error => {
  //       console.log("Error al traer beneficiarios")
  //     }
  //   });
  // }

  getProyectos() {
    this.proyectosService.getAll().subscribe({
      next: (response) => {
        console.log("Proyectos", response.respuesta)
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
        console.log("Responsables: ",response);
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
      // proyecto:     [{idProyecto: this.proyectoSelect()}, [Validators.required]],
      // responsable:  [{idResponsable: this.responsableActa()}, [Validators.required]],
      ubicacionEntrega: ['', [Validators.required]],
      prioridad: ['', [Validators.required]],
      responsableVisita: ['', [Validators.required]],
      tipoSolicitud: ['', [Validators.required]],
      productos: [null],
      paquetes: [null],
      observaciones: [''],
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
    // const idProyecto = this.formActa.get('proyecto')
    const idProyecto = 2
    const dialogRef = this.dialog.open<ISelectedProduct[]>(ProductsListSelectComponent, {
      data: {
        animal: 'perro',
      }
    });
    dialogRef.closed.subscribe(output => {
      console.log("Salida: ", output);
    })
  }

  cancelar(){
    this.formActa.reset();
    this.router.navigate(['proceedings']);
  }

  onSubmit() {
    console.log("ID Beneficiario: ", this.beneficiario()?.idBeneficiario)

    if(this.formActa.valid){
      this.formActa.value.beneficiario =  {idBeneficiario: this.beneficiario()?.idBeneficiario};
      this.formActa.value.proyecto =      {idProyecto:     this.proyectoSelect()};
      this.formActa.value.responsable =   {idResponsable:  this.responsableActa()};
      console.log("Formulario valido Acta");
      console.log(this.formActa.value);
      this.actasService.post(this.formActa.value).subscribe({
        next: resp => {
          console.log("Acta registrada correctamente");
          this.router.navigate(['proceedings']);
        },
        error: error => {
          console.log("Algo salio mal intenta de nuevo");
          console.log(error);
        }
      })
	  }else{
      console.log("Formulario no valido revisa los campos", this.formActa.value);
		  this.formActa.markAllAsTouched();
	  }
  }
}
