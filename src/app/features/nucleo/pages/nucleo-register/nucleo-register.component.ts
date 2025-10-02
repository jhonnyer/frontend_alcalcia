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
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-nucleo-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: 'nucleo-register.component.html',
  styleUrl: './nucleo-register.component.scss'
})
export class NucleoRegisterComponent implements OnDestroy {
  public formFamilyCore: FormGroup = new FormGroup({});
  public beneficiariosRegistrados: any[] = [];
  private fb = inject(FormBuilder);
  private zonaService = inject(ZonaService);
  private nucleoService = inject(NucleoService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);

  zonas = signal<IZona[]>([]);
  private zonasSubscription!: Subscription;
  barrios = signal<IBarrio[]>([]);

  beneficiarioForm: FormGroup = this.initFormBeneficiary();

  modoEdicion = false;
  beneficiarioSeleccionado: any = null;
  indiceEditado: number | null = null;
  isConfirmed = false;

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Registrar un núcleo');
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
      direccion: [''],
      nombreNucleo: ['', [Validators.required]],
      numeroIntegrantes: [0],
      beneficiarios: [this.beneficiariosRegistrados]
    });
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
      idNucleoFk: [null],
      discapacidad: [false, [Validators.required]],
      certificadoDiscapacidad: [false, [Validators.required]]
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
    if (this.beneficiarioForm.valid) {
      const data = this.beneficiarioForm.value;

      this.beneficiariosRegistrados.push(data);

      // Limpia el formulario
      this.beneficiarioForm.reset({
        tipoDocumento: 'cc',
        esVivo: true,
        discapacidad: false,
        certificadoDiscapacidad: false
      });

      // Actualiza el array del form principal para el submit final
      this.formFamilyCore.get('beneficiarios')?.setValue(this.beneficiariosRegistrados);
    } else {
      this.beneficiarioForm.markAllAsTouched();
      alert('Completa todos los campos requeridos del beneficiario antes de añadirlo.');
    }
  }

  eliminarBeneficiario(index: number): void {
    this.beneficiariosRegistrados.splice(index, 1);
    this.formFamilyCore.get('beneficiarios')?.setValue(this.beneficiariosRegistrados);
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
      const barrio = Number(this.formFamilyCore.get("idBarrioFk")?.value);

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
          const errorStr = JSON.stringify(error.error);
          if(errorStr.includes('Duplicate entry')) {
            alert('Ya existe un beneficiario registrado con este número de documento');
          } else {
            const errorMessage = 'Ha ocurrido un error al registrar los datos verifica las cedulas pueden estar duplicadas'; // error.error?.mensaje || error.message ||
            alert(errorMessage);
          }
          console.error('Error detallado:', error);
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

  cancelar() {
    this.router.navigate(['/nucleo']);
  }

  editarBeneficiario(index: number) {
    this.indiceEditado = index;
    this.beneficiarioSeleccionado = this.beneficiariosRegistrados[index];
    this.modoEdicion = true;
  }

  cerrarModal() {
    this.modoEdicion = false;
    this.beneficiarioSeleccionado = null;
  }

  guardarEdicion(data: any) {
    if (this.indiceEditado !== null) {
      this.beneficiariosRegistrados[this.indiceEditado] = data;
      this.formFamilyCore.get('beneficiarios')?.setValue(this.beneficiariosRegistrados);
    }
    this.cerrarModal();
  }

  confirmarYEnviar() {
    if (this.formFamilyCore.invalid) {
      this.formFamilyCore.markAllAsTouched();
      alert('Verifica los campos de tu formulario');
      return;
    }

    if (this.beneficiariosRegistrados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Debes agregar al menos un integrante',
        text: 'Para guardar un núcleo familiar es necesario agregar al menos un beneficiario.',
      });
      return;
    }

    Swal.fire({
      title: '¿Deseas guardar los cambios?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isConfirmed = true;
        this.onSubmit();
      }
    });
  }

}
