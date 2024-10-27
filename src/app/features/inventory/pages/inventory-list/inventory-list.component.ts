import { Component } from '@angular/core';
import {CdkTableModule} from '@angular/cdk/table';
import { productsList } from '../../../../core/data/products.data';
import { Products } from '../../interfaces/products.model';

const ELEMENT_DATA: Products[] = productsList;

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CdkTableModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent {

  displayedColumns: string[] = [
    'codigo',
    'descripcion',
    'categoria',
    'unidad_medida',
    'proveedor',
    'fecha_ingreso',
    'precio_unitario',
    'stock_actual',
    'stock_minimo',
    'ubicacion',
    'controls'
  ]
  dataSource = ELEMENT_DATA;

  delete(item: Products){
    console.log("Eliminar: ", item)
  }

  update(item: Products){
    console.log("update: ", item)
  }
}
