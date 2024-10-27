import { Component } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { Beneficiary } from '../../interfaces/beneficiary.model';
import { beneficiaryList } from '../../../../core/data/beneficiary.data';

const ELEMENT_DATA: Beneficiary[] = beneficiaryList;

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [CdkTableModule],
  templateUrl: './people-list.component.html',
  styleUrl: './people-list.component.scss'
})
export class PeopleListComponent {
  displayedColumns: string[] = [
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
  dataSource = ELEMENT_DATA;

  delete(item: Beneficiary){
    console.log("Eliminar: ", item)
  }

  update(item: Beneficiary){
    console.log("update: ", item)
  }

}
