import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IBeneficiario, IBeneficiarioUnique } from '../../../../core/models/beneficiary.models';

@Component({
  selector: 'app-beneficiary-update',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  styles: ``,
  templateUrl: './beneficiary-update.component.html'
})
export class BeneficiaryUpdateComponent implements OnInit {
  @Input('id') beneficiarioId!: string;
  private pageTitleService = inject(PageTitleService);
  private beneficiaryService = inject(BeneficiaryService);

  private router = inject(Router);
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar beneficiario');
    this.initFormFamilyCore();
    this.getBeneficiarioById();
  }

  getBeneficiarioById(){
    this.beneficiaryService.getById(this.beneficiarioId).subscribe({
      next: response => {
        console.log("BENEFICIAROIO BY ID: ",response)
        this.initProject(response);
      }
    })
  }

  private initProject(beneficiario: IBeneficiarioUnique){
    this.formFamilyCore.setValue({
      primerNombre: beneficiario.primerNombre,
      segundoNombre: beneficiario.segundoNombre,
      primerApellido: beneficiario.primerApellido,
      segundoApellido: beneficiario.segundoApellido,
      sexo: beneficiario.sexo,
      genero: beneficiario.genero,
      etnia: beneficiario.etnia,
      edad: beneficiario.edad,
      victimaConflicto: beneficiario.victimaConflicto,
      tipoDocumento: beneficiario.tipoDocumento,
      numeroDocumento: beneficiario.numeroDocumento,
      fechaNacimiento: beneficiario.fechaNacimiento,
      telefono: beneficiario.telefono,
      email: beneficiario.email,
      idNucleoFk: beneficiario.nucleoFamiliar.idNucleo,
      esVivo: beneficiario.esVivo
    }, { emitEvent: true })
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      sexo: ['', Validators.required],
      genero: ['', Validators.required],
      etnia: [''],
      edad: ['', Validators.required],
      victimaConflicto: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      telefono: ['', Validators.required],
      email: [''],
      esVivo: ['', Validators.required],
      idNucleoFk: ['']
    });
  }

  cancelar(){
    this.formFamilyCore.reset(); // Limpia los campos del formulario
    this.router.navigate(['/beneficary']); // Redirige a otra página
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      this.beneficiaryService.updateById(this.beneficiarioId, this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Se ha guardado correctamente el beneficiario');
          this.router.navigate(["/beneficary"]);
        },
        error: error => {
          alert('Ha ocurrido un error al cargar los datos');
        }
      })
	  }else
    {
      alert('Verifica los campos de tu formulario');
      this.formFamilyCore.markAllAsTouched();
    }
  }
}
