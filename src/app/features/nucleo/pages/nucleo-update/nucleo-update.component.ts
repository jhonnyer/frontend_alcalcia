import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { INucleoUpdate } from '../../../../core/models/nucleo.model';
import { IBeneficiario } from '../../../../core/models/beneficiary.models';
import { ZonaService } from '../../../../core/services/zona.service';
import { Subscription } from 'rxjs';
import { IZona } from '../../../../core/models/zona.models';
import { IBarrio } from '../../../../core/models/barrio.model';
import { Router } from '@angular/router';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog/confirm-delete-dialog.component';
import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-nucleo-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule
  ],
  styles: ``,
  templateUrl: './nucleo-update.component.html',
})
export class NucleoUpdateComponent implements OnInit{
  @Input('id') nucleoID!: string;

  private readonly nucleoService = inject(NucleoService);
  private readonly zonaService = inject(ZonaService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  private beneficiaryService = inject(BeneficiaryService);
  private dialog = inject(Dialog);

  nucleo = signal<INucleoUpdate| null>(null);
  // nucleoId!: number;
  zonas = signal<IZona[]>([]);
  listBeneficiaries = signal<IBeneficiario[]>([]);

  private zonasSubscription!: Subscription;
  barrios = signal<IBarrio[]>([]);

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar núcleo');
    this.initFormFamilyCore();
    this.getAllZonas();
    this.changeZona();
    this.getNucleoById();
  }

  getNucleoById(){
    this.nucleoService.getById(this.nucleoID).subscribe({
      next: ( response:INucleoUpdate ) => {
        this.nucleo.set(response);
        // this.nucleoId = response.idNucleo;
        this.initNucleo(response);
        this.listBeneficiaries.set(response.beneficiarios);
        this.initBeneficiaries(response.beneficiarios)
      }
    })
  }

  private initNucleo(nucleo: INucleoUpdate): void {
    this.formFamilyCore.setValue({
      idZonaFk: nucleo.idZonaFk,
      idBarrioFk: nucleo.idBarrioFk,
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
        idBeneficiario: beneficiary.idBeneficiario,
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
        discapacidad: beneficiary.discapacidad,
        certificadoDiscapacidad: beneficiary.certificadoDiscapacidad,
        idNucleoFk: parseInt(this.nucleoID)
      }, { emitEvent: true });

      beneficiaryForm.get('fechaNacimiento')?.valueChanges.subscribe(fecha => {
        if (fecha) {
          const edad = this.calcularEdad(fecha);
          beneficiaryForm.get('edad')?.setValue(edad.toString(), { emitEvent: false });
        }
      });
    });
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      idZonaFk: ['', [Validators.required, Validators.nullValidator]],
      idBarrioFk: ['', [Validators.required, Validators.nullValidator]],
      direccion: ['', [Validators.required]],
      nombreNucleo: ['', [Validators.required]],
      numeroIntegrantes: [0],
      beneficiarios: this.fb.array([])
    });
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

  private initFormBeneficiary(): FormGroup {
    // Retorna el formulario que estará anidado
    const formGroup =  this.fb.group({
      idBeneficiario: [null],
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
      email: [''],
      telefono: ['', [Validators.required]],
      esVivo: [true, [Validators.required]],
      discapacidad: [false, [Validators.required]],
      certificadoDiscapacidad: [false, [Validators.required]],
      idNucleoFk: [parseInt(this.nucleoID), [Validators.required]]
    });

    formGroup.get('fechaNacimiento')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const edad = this.calcularEdad(fecha);
        formGroup.get('edad')?.setValue(edad.toString(), { emitEvent: false });
      }
    });

    formGroup.get('certificadoDiscapacidad')?.valueChanges.subscribe(tieneCertificado => {
      if (tieneCertificado) {
        formGroup.patchValue({
          discapacidad: true
        }, { emitEvent: false });
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
    const beneficiario = beneficiariosArray.at(index);
    const idBeneficiario = beneficiario.get('idBeneficiario')?.value;

    if (idBeneficiario) {
      const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);

      dialogRef.closed.subscribe(result => {
        if (result) {
          this.beneficiaryService.delete(idBeneficiario.toString()).subscribe({
            next: () => {
              beneficiariosArray.removeAt(index);
              alert('Beneficiario eliminado exitosamente');
              this.initFormFamilyCore();
              this.getAllZonas();
              this.changeZona();
              this.getNucleoById();
            },
            error: (error) => {
              this.initFormFamilyCore();
              this.getAllZonas();
              this.changeZona();
              this.getNucleoById();
              // const errorMessage = error.error?.mensaje || 'Error al eliminar el beneficiario';
              // alert(errorMessage);
            }
          });
        }
      });
    } else {
      beneficiariosArray.removeAt(index);
    }
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

      delete this.formFamilyCore.value.idNucleo;


      this.nucleoService.updateById(this.nucleoID, this.formFamilyCore.value).subscribe({
        next: response => {
          alert('Se ha guardado correctamente el núcleo');
          this.router.navigate(["nucleo"]);
        },
        error: error => {
          alert('Ha ocurrido un error al cargar los datos, es posible que un documento ya exista');
        }
      })
	  }else
    {
      alert('Verifica los campos de tu formulario');
      this.formFamilyCore.markAllAsTouched();
    }
  }

  ngOnDestroy() {
    if (this.zonasSubscription) {
      this.zonasSubscription.unsubscribe();
    }
  }

  cancelar() {
    this.router.navigate(['/nucleo']);
  }
}
