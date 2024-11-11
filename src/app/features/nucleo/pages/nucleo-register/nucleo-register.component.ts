import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-nucleo-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: 'nucleo-register.component.html',
  styleUrl: './nucleo-register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucleoRegisterComponent {
  public formFamilyCore: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder
  ){}

  ngOnInit(): void {
    this.initFormFamilyCore();

  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      zona: ['', [Validators.required]],
      barrio: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      integrantes: ['', [Validators.required]],
      beneficiarios: this.fb.array([], [Validators.required])
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
  getCtrl(key: string, form: FormGroup): any {
    return form.get(key) as FormArray;
  }

  deletePerson(index: number): void {
    const personsFormArray = this.formFamilyCore.get('beneficiary') as FormArray;
    personsFormArray.removeAt(index);
  }


  onSubmit() {
    console.log(this.formFamilyCore.value)

  }
}
