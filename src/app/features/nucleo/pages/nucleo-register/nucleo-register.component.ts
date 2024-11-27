import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ZonaService } from '../../../../core/services/zona.service';

import { IZona } from '../../../../core/models/zona.models';
import { IBarrio } from '../../../../core/models/barrio.model';
import { Subscription } from 'rxjs';

import { NucleoService } from '../../../../core/services/nucleo.service';
import { Router } from '@angular/router';
import { IBeneficiario } from '../../../../core/models/beneficiary.models';

@Component({
  selector: 'app-nucleo-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: 'nucleo-register.component.html',
  styleUrl: './nucleo-register.component.scss'
})
export class NucleoRegisterComponent implements OnDestroy {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private zonaService = inject(ZonaService);
  private nucleoService = inject(NucleoService);
  private router = inject(Router);

  zonas = signal<IZona[]>([]);
  private zonasSubscription!: Subscription;
  barrios = signal<IBarrio[]>([]);

  ngOnInit(): void {
    this.initFormFamilyCore();
    this.getAllZonas();
    this.changeZona();
  }

  getAllZonas(){
    this.zonasSubscription = this.zonaService.getAll().subscribe({
      next: (response:IZona[]) => {
        this.zonas.set(response);
      },
      error: (error) => {
        console.log("Error en zonas: ", error);
      }
    });
  }

  changeZona(){
    this.formFamilyCore.get('idZonaFk')?.valueChanges.subscribe({
      next: option => {
        if(option !== ''){
          this.zonaService.getById(option).subscribe({
            next: response => {
              this.barrios.set(response.barrios as IBarrio[])
            }
          })
        }
      }
    })
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      idZonaFk: ['', [Validators.required, Validators.nullValidator]],
      idBarrioFk: ['', [Validators.required, Validators.nullValidator]],
      direccion: ['', [Validators.required]],
      nombreNucleo: ['', [Validators.required]],
      numeroIntegrantes: [0],
      beneficiarios: this.fb.array([])
    });
    this.addBeneficiary();
  }

  initFormBeneficiary(): FormGroup {
    // Retorna el formulario que estará anidado
    const formGroup = this.fb.group({
      primerNombre: ['', [Validators.required]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required]],
      segundoApellido: [''],
      tipoDocumento: ['cc', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      victimaConflicto: [false, [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      edad: ['', [Validators.required]],
      etnia: ['', [Validators.required]],
      email: [''],
      telefono: ['', [Validators.required]],
      esVivo: [true, [Validators.required]],
      idNucleoFk: [null]
    });

    formGroup.get('fechaNacimiento')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const edad = this.calcularEdad(fecha);
        formGroup.get('edad')?.setValue(edad.toString(), { emitEvent: false });
      }
    });

    return formGroup;
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

  calcularEdad(fechaNacimiento: string): number {
    const fechaNacimientoDate = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimientoDate.getFullYear();  

    const mes = hoy.getMonth() - fechaNacimientoDate.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimientoDate.getDate())) {
      edad--;
    }
    return edad;
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      const zona = Number(this.formFamilyCore.get("idZonaFk")?.value);
      const barrio = Number(this.formFamilyCore.get("idZonaFk")?.value);

      this.formFamilyCore.patchValue({
        numeroIntegrantes: null,
        idZonaFk: zona,
        idBarrioFk: barrio
      });

      this.nucleoService.post(this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Se ha guardado correctamente el núcleo');
          this.router.navigate(["nucleo"]);
        },
        error: error => {
          alert('Ha ocurrido un error al cargar los datos');
        }
      })
	  }else{
      alert('Verifica los campos de tu formulario');
		  this.formFamilyCore.markAllAsTouched();
	  }
  }

  ngOnDestroy() {
    if (this.zonasSubscription) {
      this.zonasSubscription.unsubscribe();
    }
  }
}
