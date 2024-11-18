import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { INucleo } from '../../../../core/models/nucleo.model';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { IBeneficiary } from '../../../../core/models/beneficiary.models';

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
  @Input('id') productId!: string;

  private readonly nucleoService = inject(NucleoService);
  private readonly beneficiaryService = inject(BeneficiaryService);

  nucleo = signal<INucleo| null>(null);
  nucleoId = '';
  listBeneficiaries = signal<IBeneficiary[]>([]);

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    console.log(this.productId)
    this.initFormFamilyCore();
    this.getNucleoById();
  }

  getNucleoById(){
    this.nucleoService.getById(this.productId).subscribe({
      next: ( response:INucleo ) => {
        console.log("Nucleo",response);
        this.nucleo.set(response);
        this.nucleoId = response.id;
        this.initNucleo(response);
        this.getBeneficiaryByNucleo();

      }
    })
  }

  getBeneficiaryByNucleo() {
    if (this.nucleo() !== undefined && this.nucleo() !== null) {
      this.beneficiaryService.getByNucleoId(this.nucleoId).subscribe({
        next: (response: IBeneficiary[]) => {
          console.log('Beneficiarios: ', response);
          this.listBeneficiaries.set(response);
          this.initBeneficiaries(response)
        }
      });
    }
  }

  private initNucleo(nucleo: INucleo): void {
    this.formFamilyCore.setValue({
      zona: nucleo.zona,
      barrio: nucleo.barrio,
      direccion: nucleo.direccion,
      nombreNucleo: nucleo.nombreNucleo,
      beneficiarios: []
    }, { emitEvent: true })
  }

  private initBeneficiaries(beneficiaries: IBeneficiary[]): void {
    const beneficiariosArray = this.formFamilyCore.get('beneficiarios') as FormArray;
    beneficiaries.forEach((beneficiary) => {
      beneficiariosArray.push(this.initFormBeneficiary());
      const beneficiaryForm = beneficiariosArray.at(beneficiariosArray.length - 1);
      beneficiaryForm.setValue({
        nombre1: beneficiary.nombre1,
        nombre2: beneficiary.nombre2,
        apellido1: beneficiary.apellido1,
        apellido2: beneficiary.apellido2,
        tipoDocumento: beneficiary.tipoDocumento,
        numeroDocumento: beneficiary.numeroDocumento,
        sexo: beneficiary.sexo,
        genero: beneficiary.genero,
        victimaConflico: beneficiary.victimaConflico,
        fechaNacimiento: beneficiary.fechaNacimiento,
        edad: beneficiary.edad,
        etnia: beneficiary.etnia,
        email: beneficiary.email,
        telefono: beneficiary.telefono
      }, { emitEvent: true });
    });
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      zona: ['', [Validators.required]],
      barrio: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      nombreNucleo: ['', [Validators.required]],
      beneficiarios: this.fb.array([])
    });
    // this.addBeneficiary();
  }

  private initFormBeneficiary(): FormGroup {
    // Retorna el formulario que estará anidado
    return this.fb.group({
      nombre1: ['', [Validators.required]],
      nombre2: [''],
      apellido1: ['', [Validators.required]],
      apellido2: [''],
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


}
