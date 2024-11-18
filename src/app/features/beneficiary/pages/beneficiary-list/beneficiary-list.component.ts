import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { IBeneficiary } from '../../../../core/models/beneficiary.models';
import { beneficiaryList } from '../../../../core/data/beneficiary.data';
import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';

const ELEMENT_DATA: IBeneficiary[] = beneficiaryList;

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [
    CommonModule, TableTemplateComponent, StepperPaginationComponent
],
  templateUrl: './beneficiary-list.component.html',
  styles: ``,
})
export class BeneficiaryListComponent {
  displayedColumns: (keyof IBeneficiary | 'controls')[] = [
    'id_beneficiario',
    'idNucleo',
    'nombre1',
    'nombre2',
    'apellido1',
    'apellido2',
    'sexo',
    'genero',
    'etnia',
    'edad',
    'victimaConflico',
    'tipoDocumento',
    'numeroDocumento',
    'fechaNacimiento',
    'telefono',
    'email',
    'controls'
  ]

  data: IBeneficiary[] = ELEMENT_DATA;

  columnSearch = 'categoria';

  sorteablesColumns: string[] = [
    "codigo",
    "descripcion",
    "categoria",
    "unidad_medida",
    "proveedor",
    "fecha_ingreso",
    "precio_unitario",
    "stock_actual",
    "stock_minimo",
    "ubicacion"
  ]

  stickyColumns = [
    "codigo"
  ]

  delete(item: IBeneficiary){
    console.log("Eliminar: ", item)
  }

  update(item: IBeneficiary){
    console.log("update: ", item)
  }
}
