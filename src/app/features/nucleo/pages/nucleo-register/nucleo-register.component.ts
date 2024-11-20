import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ZonaService } from '../../../../core/services/zona.service';
import { BarrioService } from '../../../../core/services/barrio.service';

import { IZona } from '../../../../core/models/zona.models';
import { IBarrio } from '../../../../core/models/barrio.model';
@Component({
  selector: 'app-nucleo-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: 'nucleo-register.component.html',
  styleUrl: './nucleo-register.component.scss'
})
export class NucleoRegisterComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private zonaService = inject(ZonaService);
  private barrioService = inject(BarrioService);

  zonas = signal<IZona[]>([]);
  barrios = signal<IBarrio[]>([]);

  ngOnInit(): void {
    this.initFormFamilyCore();
    this.getAllZonas();
    this.getAllBarrios();
  }

  getAllZonas(){
    this.zonaService.getAll().subscribe({
      next: (response:IZona[]) => {
        console.log(response)
        this.zonas.set(response);

      }
    });
  }

  getAllBarrios(){
    this.barrioService.getAll().subscribe({
      next: (response:IBarrio[]) => {
        console.log(response)
        this.barrios.set(response);
      }
    });
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      zona: ['', [Validators.required]],
      barrio: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      nombreNucleo: ['', [Validators.required]],
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
      tipoDocumento: ['cc', [Validators.required]],
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

  onSubmit() {
    if(this.formFamilyCore.valid){
      console.log("Form Family Core");
      console.log(this.formFamilyCore.value);
	  }else{
      console.log("Error");
      console.log(this.formFamilyCore.value);
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
