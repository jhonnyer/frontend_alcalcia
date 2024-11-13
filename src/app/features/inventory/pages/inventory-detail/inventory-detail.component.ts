import { Component } from '@angular/core';
import { Products } from '../../../../core/models/products.model';
import { productsList } from '../../../../core/data/products.data';
import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [TableTemplateComponent],
  templateUrl: './inventory-detail.component.html',
  styleUrl: './inventory-detail.component.scss'
})
export class InventoryDetailComponent {
  data = productsList;

  displayedColumns = [
    "codigo",
    "descripcion",
    "categoria",
    "unidad_medida",
    "proveedor",
    "fecha_ingreso",
    "precio_unitario",
    "stock_actual",
    "stock_minimo",
    "ubicacion",
    "controls"
  ]

  sorteablesColumns = [
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

  delete(event: any){
    console.log(event)
  }

  update(event: any){
    console.log(event)
  }
}
