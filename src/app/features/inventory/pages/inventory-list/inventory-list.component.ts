import { Component, OnInit } from '@angular/core';
import {CdkTableModule} from '@angular/cdk/table';
import { productsList } from '../../../../core/data/products.data';

export interface Products {
  codigo: string;
  descripcion: string;
  categoria: string;
  unidad_medida: string;
  proveedor: string;
  fecha_ingreso: string;
  precio_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: string;
}

const ELEMENT_DATA: Products[] = productsList;

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CdkTableModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit{

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
    'ubicacion'
  ]
  dataSource = ELEMENT_DATA;

  ngOnInit(): void {
    console.log('Tabla: ', this.dataSource);
  }
}
