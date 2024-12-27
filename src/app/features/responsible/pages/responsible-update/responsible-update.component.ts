import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResponsibleService } from '../../../../core/services/responsible.service';
import { IResponsable } from '../../../../core/models/responsable.model';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-responsible-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './responsible-update.component.html'
})
export class ResponsibleUpdateComponent implements OnInit{
  @Input('id') responsableId!: string;

  private router = inject(Router);
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private responsibleService = inject(ResponsibleService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Actualizar responsable');
    this.initFormFamilyCore();
    this.getResponsableById();
  }


  getResponsableById(){
    this.responsibleService.getByParams(this.responsableId).subscribe({
      next: response => {
        this.initResponsable(response);
      }
    })
  }

  private initResponsable(responsable: IResponsable){
    this.formFamilyCore.patchValue({
      idResponsable: responsable.idResponsable,
      primerNombre: responsable.primerNombre,
      segundoNombre: responsable.segundoNombre,
      primerApellido: responsable.primerApellido,
      segundoApellido: responsable.segundoApellido,
      tipoIdentificacion: responsable.tipoIdentificacion,
      numeroIdentificacion: responsable.numeroIdentificacion,
      area: responsable.area,
      cargo: responsable.cargo,
      email: responsable.email,
      usuario: responsable.usuario,
      telefono: responsable.telefono,
      estado: responsable.estado,
      perfilUsuario: responsable.perfilUsuario
    }, { emitEvent: true })
  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      idResponsable: ['', [Validators.required]],
      primerNombre: ['', [Validators.required]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required]],
      segundoApellido: [''],
      tipoIdentificacion: ['', [Validators.required]],
      numeroIdentificacion: ['', [Validators.required]],
      area: ['', [Validators.required]],
      cargo: ['', [Validators.required]],
      email: ['', [Validators.required]],
      usuario: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      perfilUsuario: ['', [Validators.required]],
      password: ['']
    });
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  onSubmit() {
    if(this.formFamilyCore.valid){
      this.responsibleService.updateById(this.responsableId, this.formFamilyCore.value).subscribe({
        next: response => {
          alert('El perfil se ha actualizado correctamente');
          this.router.navigate(['resposibles']);
        }
      })
	  }else{
      alert('Verifica los campos del formulario de registro');
      console.log("Fallo",this.formFamilyCore);
		  this.formFamilyCore.markAllAsTouched();
	  }
  }

}
