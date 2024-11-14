import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Beneficiary } from '../../interfaces/beneficiary.model';
import { beneficiaryList } from '../../../../core/data/beneficiary.data';
import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';

const ELEMENT_DATA: Beneficiary[] = beneficiaryList;

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
  displayedColumns: (keyof Beneficiary | 'controls')[] = [
    'id_beneficiario',
    'nombres_apellidos',
    'documento_identidad',
    'fecha_nacimiento',
    'direccion',
    'telefono',
    'correo_electronico',
    'programa_id',
    'fecha_ingreso',
    'estado',
    'observaciones',
    'controls'
  ]

  data: Beneficiary[] = ELEMENT_DATA;

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

  delete(item: Beneficiary){
    console.log("Eliminar: ", item)
  }

  update(item: Beneficiary){
    console.log("update: ", item)
  }
}
