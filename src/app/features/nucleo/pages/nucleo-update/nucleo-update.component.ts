import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { INucleo, INucleoUpdate } from '../../../../core/models/nucleo.model';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { IBeneficiario, IBeneficiary } from '../../../../core/models/beneficiary.models';
import { ZonaService } from '../../../../core/services/zona.service';
import { BarrioService } from '../../../../core/services/barrio.service';
import { Subscription } from 'rxjs';
import { IZona } from '../../../../core/models/zona.models';
import { IBarrio } from '../../../../core/models/barrio.model';
@Component({
  selector: 'app-nucleo-update',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule
  ],
  styles: ``,
  templateUrl: './nucleo-update.component.html',
})
export class NucleoUpdateComponent implements OnInit{
  @Input('id') nucleoID!: string;

  private readonly nucleoService = inject(NucleoService);
  private readonly zonaService = inject(ZonaService);
  private readonly barrioService = inject(BarrioService);

  nucleo = signal<INucleoUpdate| null>(null);
  nucleoId!: number;
  nombreZona = '';
  nombreBarrio = '';
  listBeneficiaries = signal<IBeneficiario[]>([]);

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);


  ngOnInit(): void {
    console.log("nucleoID", this.nucleoID)
    this.initFormFamilyCore();
    this.getAllZonas();
    this.changeZona();
    this.getNucleoById();
  }

  getNucleoById(){
    this.nucleoService.getById(this.nucleoID).subscribe({
      next: ( response:INucleoUpdate ) => {
        console.log("Nucleo",response);
        this.nucleo.set(response);
        this.nucleoId = response.idNucleo;
        this.initNucleo(response);
        this.listBeneficiaries.set(response.beneficiarios);
        this.initBeneficiaries(response.beneficiarios)
        this.getZonaById(1);
        this.getBarrioById(1);
      }
    })
  }

  getZonaById(id:number) {
    this.zonaService.getById(id).subscribe({
      next: response => {
        console.log("Zona: ", response)
        this.nombreZona = response.nombreZona;
      }
    })
  }

  getBarrioById(id:number) {
    this.barrioService.getById(id).subscribe({
      next: response => {
        console.log("Barrio: ", response)
        this.nombreBarrio = response.nombre;
      }
    })
  }

  private initNucleo(nucleo: INucleoUpdate): void {
    this.formFamilyCore.setValue({
      // zona: this.nombreZona,
      // barrio: this.nombreBarrio,
      // direccion: nucleo.direccion,
      // nombreNucleo: nucleo.nombreNucleo,
      // beneficiarios: []

      idZonaFk: this.nombreZona,
      idBarrioFk: this.nombreBarrio,
      direccion: nucleo.direccion,
      nombreNucleo: nucleo.nombreNucleo,
      numeroIntegrantes: nucleo.numeroIntegrantes,
      beneficiarios: []
    }, { emitEvent: true })
  }

  private initBeneficiaries(beneficiaries: IBeneficiario[]): void {
    const beneficiariosArray = this.formFamilyCore.get('beneficiarios') as FormArray;
    beneficiaries.forEach((beneficiary) => {
      beneficiariosArray.push(this.initFormBeneficiary());
      const beneficiaryForm = beneficiariosArray.at(beneficiariosArray.length - 1);
      beneficiaryForm.setValue({
        primerNombre: beneficiary.primerNombre,
        segundoNombre: beneficiary.segundoNombre,
        primerApellido: beneficiary.primerApellido,
        segundoApellido: beneficiary.segundoApellido,
        tipoDocumento: beneficiary.tipoDocumento,
        numeroDocumento: beneficiary.numeroDocumento,
        sexo: beneficiary.sexo,
        genero: beneficiary.genero,
        victimaConflicto: beneficiary.victimaConflicto,
        fechaNacimiento: beneficiary.fechaNacimiento,
        edad: beneficiary.edad,
        etnia: beneficiary.etnia,
        email: beneficiary.email,
        telefono: beneficiary.telefono,
        esVivo: beneficiary.esVivo,
        idNucleoFk: [this.nucleoID]
      }, { emitEvent: true });
    });
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      // zona: ['', [Validators.required]],
      // barrio: ['', [Validators.required]],
      // direccion: ['', [Validators.required]],
      // nombreNucleo: ['', [Validators.required]],
      // beneficiarios: this.fb.array([])

      idZonaFk: ['', [Validators.required, Validators.nullValidator]],
      idBarrioFk: ['', [Validators.required, Validators.nullValidator]],
      direccion: ['', [Validators.required]],
      nombreNucleo: ['', [Validators.required]],
      numeroIntegrantes: [0],
      beneficiarios: this.fb.array([])
    });
    // this.addBeneficiary();
  }

  private initFormBeneficiary(): FormGroup {
    // Retorna el formulario que estará anidado

    return this.fb.group({
      primerNombre: ['', [Validators.required]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required]],
      segundoApellido: [''],
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      victimaConflicto: [false, [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      edad: ['', [Validators.required]],
      etnia: ['', [Validators.required]],
      email: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      esVivo: [true, [Validators.required]],
      idNucleoFk: [this.nucleoID]
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
      console.log("Form invalid");
      console.log(this.formFamilyCore.value);
		  this.formFamilyCore.markAllAsTouched();
	  }
  }

  /**** */
  zonas = signal<IZona[]>([]);
  private zonasSubscription!: Subscription;
  barrios = signal<IBarrio[]>([]);

  getAllZonas(){
    this.zonasSubscription = this.zonaService.getAll().subscribe({
      next: (response:IZona[]) => {
        console.log("ZONAS: ", response)
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

  ngOnDestroy() {
    if (this.zonasSubscription) {

      this.zonasSubscription.unsubscribe();
    }
  }

}
