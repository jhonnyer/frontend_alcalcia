import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { NucleoService } from '../../../../core/services/nucleo.service';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { INucleoUpdate } from '../../../../core/models/nucleo.model';
import { IBeneficiario } from '../../../../core/models/beneficiary.models';
import { ZonaService } from '../../../../core/services/zona.service';
import { Subscription } from 'rxjs';
import { IZona } from '../../../../core/models/zona.models';
import { IBarrio } from '../../../../core/models/barrio.model';
import { ActivatedRoute, Router } from '@angular/router';
import { PageTitleService } from '../../../../core/services/pageTitle.service';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { DialogModule } from '@angular/cdk/dialog';
import { ActasService } from '../../../../core/services/actas.service';
import { MatDialog } from '@angular/material/dialog';
import { BeneficiarioModalComponent } from '../beneficiario-modal/beneficiario-modal.component';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../components/confirm-accion-dialog/confirm-dialog.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AlertService } from '../../../../core/services/alert.service';


@Component({
  selector: 'app-nucleo-update',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    DialogModule, 
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    ],
  templateUrl: './nucleo-update.component.html',
})
export class NucleoUpdateComponent implements OnInit {
  // 👉 dinámico
  public tituloPagina = 'Registrar núcleo';  
  displayedColumns: string[] = ['nombreCompleto','documento','edad', 'acciones'];
  isNucleoCreado = false;

  // Si viene con id es actualización
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public nucleoID: string | null = null;

  dataSource = new MatTableDataSource<IBeneficiario>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar ) {}

  private readonly nucleoService = inject(NucleoService);
  private readonly zonaService = inject(ZonaService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly beneficiaryService = inject(BeneficiaryService);
  private readonly actasService = inject(ActasService);
  private alert = inject(AlertService);

  nucleo = signal<INucleoUpdate | null>(null);
  zonas = signal<IZona[]>([]);
  listBeneficiaries = signal<IBeneficiario[]>([]);
  private zonasSubscription!: Subscription;
  barrios = signal<IBarrio[]>([]);

  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.nucleoID = this.route.snapshot.paramMap.get('id');

    if (this.nucleoID) {
      this.tituloPagina = 'Actualizar núcleo';
      this.isNucleoCreado = true;
      this.pageTitleService.setCurrentPage(this.tituloPagina);
      this.getNucleoById(); // carga datos
    } else {
      this.tituloPagina = 'Registrar núcleo';
      this.pageTitleService.setCurrentPage(this.tituloPagina);
    }

    this.initFormFamilyCore();
    this.getAllZonas();
    this.changeZona();
    this.dataSource.data = this.beneficiariosForTable ?? [];
    // 🔹 Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: IBeneficiario, filter: string) => {
      const search = filter.trim().toLowerCase();
      return (
        (data.primerNombre?.toLowerCase().includes(search)) ||
        (data.segundoNombre?.toLowerCase().includes(search)) ||
        (data.primerApellido?.toLowerCase().includes(search)) ||
        (data.segundoApellido?.toLowerCase().includes(search)) ||
        (data.numeroDocumento?.toLowerCase().includes(search))  
      );
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.page.subscribe(() => {
      this.applyFilter({ target: { value: '' } } as any); 
    });
  }

  getNucleoById() {
  if (!this.nucleoID) return; // si es null, no hace nada

    this.nucleoService.getById(this.nucleoID).subscribe({
      next: (response: INucleoUpdate) => {
        this.nucleo.set(response);
        this.initNucleo(response);
        this.listBeneficiaries.set(response.beneficiarios);
        this.initBeneficiaries(response.beneficiarios);
        this.actualizarTabla();
      },
    });
  }

  actualizarTabla(): void {
    this.dataSource.data = this.beneficiariosForTable.map((b) => ({
      ...b,
      nombreCompleto: `${b.primerNombre} ${b.segundoNombre ?? ''} ${b.primerApellido} ${b.segundoApellido ?? ''}`.trim(),
      documento: `${b.tipoDocumento} - ${b.numeroDocumento}`,
    }));
  }


  private initNucleo(nucleo: INucleoUpdate): void {
  // 👉 primero seteamos lo que no depende de otros
    this.formFamilyCore.patchValue({
      idZonaFk:nucleo.idZonaFk,
      idBarrioFk:nucleo.idBarrioFk
    });
    this.formFamilyCore.patchValue({
      direccion: nucleo.direccion,
      nombreNucleo: nucleo.nombreNucleo,
      numeroIntegrantes: nucleo.numeroIntegrantes,
      beneficiarios: []
    },{emitEvent:true})
  }

  private initBeneficiaries(beneficiaries: IBeneficiario[]): void {
    const beneficiariosArray = this.formFamilyCore.get(
      'beneficiarios'
    ) as FormArray;

    beneficiariosArray.clear();

    beneficiaries.forEach((beneficiary) => {
      beneficiariosArray.push(this.initFormBeneficiary());
      const beneficiaryForm =
        beneficiariosArray.at(beneficiariosArray.length - 1);
      beneficiaryForm.patchValue(
        {
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
          idNucleoFk: this.nucleoID ? parseInt(this.nucleoID) : null,
        },
        { emitEvent: true }
      );

      beneficiaryForm.get('fechaNacimiento')?.valueChanges.subscribe((fecha) => {
        if (fecha) {
          const edad = this.calcularEdad(fecha);
          beneficiaryForm
            .get('edad')
            ?.setValue(edad.toString(), { emitEvent: false });
        }
      });
    });
  }

  private initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      idZonaFk: ['', [Validators.required, Validators.nullValidator]],
      idBarrioFk: ['', [Validators.required, Validators.nullValidator]],
      direccion: [''],
      nombreNucleo: ['', [Validators.required]],
      numeroIntegrantes: [0],
      beneficiarios: this.fb.array([]),
    });
  }

  getAllZonas() {
    this.zonasSubscription = this.zonaService.getAll().subscribe({
      next: (response: IZona[]) => {
        this.zonas.set(response);
      },
      error: (error) => {
        console.log('Error en zonas: ', error);
      },
    });
  }

  changeZona() {
    this.formFamilyCore.get('idZonaFk')?.valueChanges.subscribe({
      next: (option) => {
        if (option !== '') {
          this.zonaService.getById(option).subscribe({
            next: (response) => {
              this.barrios.set(response.barrios as IBarrio[]);
            },
          });
        }
      },
    });
  }

  private initFormBeneficiary(): FormGroup {
    const formGroup = this.fb.group({
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
      email: ['', [Validators.required, Validators.pattern(/^[\w._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      esVivo: [true, [Validators.required]],
      discapacidad: [false, [Validators.required]],
      certificadoDiscapacidad: [false, [Validators.required]],
      idNucleoFk: [this.nucleoID ? parseInt(this.nucleoID) : null, [Validators.required]],
    });

    formGroup.get('fechaNacimiento')?.valueChanges.subscribe((fecha) => {
      if (fecha) {
        const edad = this.calcularEdad(fecha);
        formGroup.get('edad')?.setValue(edad.toString(), { emitEvent: false });
      }
    });

    formGroup
      .get('certificadoDiscapacidad')
      ?.valueChanges.subscribe((tieneCertificado) => {
        if (tieneCertificado) {
          formGroup.patchValue(
            {
              discapacidad: true,
            },
            { emitEvent: false }
          );
        }
      });

    return formGroup;
  }

  deletePerson(beneficiarioEliminar: IBeneficiario): void {
     // 🔹 Buscar el índice real en el FormArray
    const index = this.beneficiariosFormArray.controls.findIndex(
      (ctrl) => ctrl.value.idBeneficiario === beneficiarioEliminar.idBeneficiario
    );

    if (index === -1) {
      this.snackBar.open('❌ No se encontró el beneficiario en el formulario', 'Cerrar', { duration: 3000 });
      return;
    }
    const beneficiariosArray = this.formFamilyCore.get(
      'beneficiarios'
    ) as FormArray;
    const beneficiario = beneficiariosArray.at(index);
    const idBeneficiario = beneficiario.get('idBeneficiario')?.value;

    this.actasService.getCountActas(idBeneficiario).subscribe({
      next: (response) => {
        if (response === 0) {
          if (idBeneficiario) {
            const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);
            dialogRef.afterClosed().subscribe((result) => {
              if (result) {
                this.beneficiaryService
                  .delete(idBeneficiario.toString())
                  .subscribe({
                    next: () => {
                      beneficiariosArray.removeAt(index);
                      //Actualizar tabla beneficiarios 
                      this.actualizarTabla();
                      this.alert.confirm('Operación','Beneficiario eliminado exitosamente');
                    },
                    error: () => {
                      this.alert.error('Error servicio',
                        'Ha ocurrido un error al intentar eliminar el beneficiario'
                      );
                    },
                  });
              }
            });
          } else {
            beneficiariosArray.removeAt(index);
          }
        } else {
          this.alert.warning('Alerta',
            'El beneficiario "' +
              beneficiarioEliminar.primerNombre +
              '", no puede eliminarse porque tiene actas asociadas'
          );
        }
      },
      error: (error) => {
        this.alert.error('Error servicio','Error al eliminar el beneficiario: ' + error);
      },
    });
  }

  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  get beneficiariosFormArray(): FormArray {
    return this.formFamilyCore.get('beneficiarios') as FormArray;
  }

  calcularEdad(fechaNacimiento: string): number {
    const fechaNacimientoDate = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimientoDate.getFullYear();

    const mes = hoy.getMonth() - fechaNacimientoDate.getMonth();
    if (
      mes < 0 ||
      (mes === 0 && hoy.getDate() < fechaNacimientoDate.getDate())
    ) {
      edad--;
    }
    return edad < 0 ? 0 : edad;
  }

  onSubmit() {
    if (this.formFamilyCore.invalid) {
      
      // Errores de los controles raíz (zona, barrio, nombreNucleo, etc.)
      Object.keys(this.formFamilyCore.controls).forEach(key => {
        const control = this.formFamilyCore.get(key);
        if (control?.invalid && key !== 'beneficiarios') {
          console.warn(`Campo núcleo '${key}' inválido -> errores:`, control.errors, 'valor:', control.value);
        }
      });

      // ✅ Errores de los beneficiarios
      this.beneficiariosFormArray.controls.forEach((ctrl, index) => {
        const formGroup = ctrl as FormGroup;
        if (formGroup.invalid) {
          console.warn(`❌ Beneficiario #${index + 1} inválido:`, formGroup.value);
          Object.keys(formGroup.controls).forEach(key => {
            const c = formGroup.get(key);
            if (c?.invalid) {
              console.warn(`   Campo '${key}' inválido -> errores:`, c.errors, 'valor:', c.value);
            }
          });
        }
      });

      this.formFamilyCore.markAllAsTouched();
      this.snackBar.open('⚠️ Verifica los campos del formulario (núcleo o beneficiarios)', 'Cerrar', { duration: 3000 });
      return;
    }

    // 🟢 Si es válido, pedimos confirmación
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: this.nucleoID ? '¿Desea actualizar este núcleo?' : '¿Desea crear este núcleo?' }
    });

    confirmRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;

      // 🟢 Si es válido, arma el payload
      const zona = Number(this.formFamilyCore.get('idZonaFk')?.value);
      const barrio = Number(this.formFamilyCore.get('idBarrioFk')?.value);

      const payload: INucleoUpdate = {
        idNucleo: Number(this.nucleoID),
        idZonaFk: zona,
        idBarrioFk: barrio,
        numeroIntegrantes: this.beneficiariosFormArray.length,
        direccion: this.formFamilyCore.get('direccion')?.value,
        nombreNucleo: this.formFamilyCore.get('nombreNucleo')?.value,
        nombreZona: null,
        nombreBarrio: null,
        beneficiarios: this.beneficiariosFormArray.value.map((b: any) => ({
          idBeneficiario: b.idBeneficiario,
          primerNombre: b.primerNombre,
          segundoNombre: b.segundoNombre,
          primerApellido: b.primerApellido,
          segundoApellido: b.segundoApellido,
          sexo: b.sexo,
          genero: b.genero,
          etnia: b.etnia,
          edad: b.edad,
          victimaConflicto: b.victimaConflicto,
          tipoDocumento: b.tipoDocumento,
          numeroDocumento: b.numeroDocumento,
          fechaNacimiento: b.fechaNacimiento,
          telefono: b.telefono, 
          email: b.email,
          esVivo: b.esVivo,
          discapacidad: b.discapacidad,
          certificadoDiscapacidad: b.certificadoDiscapacidad,
          idNucleoFk: this.nucleoID ? parseInt(this.nucleoID) : null,
          nombreNucleo: null,
          direccionNucleo: null,
          barrio: null,
          zona: null,
          ubicacion: null
        }))
      };

      // 🔥 Llamada al servicio
      if (!this.nucleoID) {
        this.nucleoService.post(payload).subscribe({
          next: (nuevoNucleo) => {
            this.snackBar.open('✅ Núcleo creado con éxito', 'Cerrar', { duration: 3000 });

            // guardar el id para futuros beneficiarios
            this.nucleoID = nuevoNucleo.idNucleo.toString();
            this.isNucleoCreado = true; 
  
            // me quedo en la misma vista, no hago navigate
            this.formFamilyCore.patchValue({ idNucleo: this.nucleoID });
          },
          error: () => {
            this.snackBar.open('❌ Error al crear núcleo', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        // Actualizar
        this.nucleoService.updateById(this.nucleoID, payload).subscribe({
          next: () => {
            this.snackBar.open('✅ Núcleo actualizado con éxito', 'Cerrar', { duration: 3000 });
            this.router.navigate(['nucleo']);
          },
          error: () => {
            this.snackBar.open('❌ Error al actualizar núcleo', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }


  ngOnDestroy() {
    if (this.zonasSubscription) {
      this.zonasSubscription.unsubscribe();
    }
  }

  cancelar() {
    this.router.navigate(['/nucleo']);
  }

  //  Método para añadir beneficiario
  addBeneficiario(): void {
    const form = this.initFormBeneficiary();

    const dialogRef = this.dialog.open(BeneficiarioModalComponent, {
      width: '70%',
      maxWidth: '90vw',
      height: '90vh',
      data: { form, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // abrir confirmación
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: { mensaje: '¿Desea crear este beneficiario?' }
        });

        confirmRef.afterClosed().subscribe(confirmado => {
          if (confirmado) {
            // llamar servicio
            this.beneficiaryService.post(result).subscribe({
              next: (response) => {
                // Usar el beneficiario que viene del backend
                const nuevoBeneficiario = response.respuesta || response;
                this.beneficiariosFormArray.push(this.initFormBeneficiary());
                const form = this.beneficiariosFormArray.at(this.beneficiariosFormArray.length - 1);
                form.patchValue(nuevoBeneficiario);
                this.actualizarTabla();
                this.snackBar.open('✅ Beneficiario creado con éxito', 'Cerrar', { duration: 3000 });
              },
              error: (err) => {
                let mensajeError = '❌ Error desconocido al crear beneficiario';

                // Si el backend envía el error dentro de err.error.mensaje (caso ApiResponse)
                if (err?.error?.mensaje) {
                  mensajeError = `❌ ${err.error.mensaje}`;
                }
                // Si el backend devuelve solo un string (caso excepción simple)
                else if (typeof err?.error === 'string') {
                  mensajeError = `❌ ${err.error}`;
                }
                // Si es una excepción genérica de Angular HTTP
                else if (err?.message) {
                  mensajeError = `❌ ${err.message}`;
                }

                this.snackBar.open(mensajeError, 'Cerrar', {
                  duration: 4000,
                  panelClass: ['snackbar-error']
                });
              }
            });
          }
        });
      }
    });
  }

  editBeneficiary(beneficiario: IBeneficiario): void {
     // 🔹 Buscar el índice real en el FormArray
    const index = this.beneficiariosFormArray.controls.findIndex(
      (ctrl) => ctrl.value.idBeneficiario === beneficiario.idBeneficiario
    );

    if (index === -1) {
      this.snackBar.open('❌ No se encontró el beneficiario en el formulario', 'Cerrar', { duration: 3000 });
      return;
    }
    const originalForm = this.beneficiariosFormArray.at(index) as FormGroup;
    const tempForm = this.initFormBeneficiary();
    tempForm.patchValue(originalForm.getRawValue(), { emitEvent: false })
    
    const dialogRef = this.dialog.open(BeneficiarioModalComponent, {
      width: '70%',
      maxWidth: '90vw',
      height: '90vh',
      data: { form: tempForm, isEdit: true},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // 🟢 Abrir confirmación antes de guardar cambios
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: { mensaje: '¿Desea guardar los cambios de este beneficiario?' }
        });

        confirmRef.afterClosed().subscribe((confirmado) => {
          if (confirmado) {
            // ✅ Llamamos al servicio update
            const idBeneficiario = originalForm.get('idBeneficiario')?.value;

            if (!idBeneficiario) {
              this.snackBar.open('No se encontró el ID del beneficiario.', 'Cerrar', { duration: 3000 });
              return;
            }

            this.beneficiaryService.update(idBeneficiario, result).subscribe({
              next: (response) => {
                const updated = response.respuesta || result;
                originalForm.patchValue(updated);
                //Actualizar tabla beneficiarios 
                this.actualizarTabla();
                this.snackBar.open('✅ Beneficiario actualizado correctamente.', 'Cerrar', { duration: 3000 });
              },
              error: (err) => {
                let mensajeError = '❌ Ha ocurrido un error al guardar el beneficiario';

                if (err?.error?.mensaje) {
                  mensajeError = `❌ ${err.error.mensaje}`;
                } else if (typeof err?.error === 'string') {
                  mensajeError = `❌ ${err.error}`;
                } else if (err?.message) {
                  mensajeError = `❌ ${err.message}`;
                }
                this.snackBar.open(mensajeError, 'Cerrar', {
                  duration: 4000,
                  panelClass: ['snackbar-error']
                });
              }
            });
          }
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  get beneficiariosForTable(): IBeneficiario[] {
    return this.beneficiariosFormArray.value as IBeneficiario[];
  }

}
