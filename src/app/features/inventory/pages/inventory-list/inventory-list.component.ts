import { Component, inject, computed, effect, OnInit, Injector } from '@angular/core';
import { CdkTableModule, DataSource } from '@angular/cdk/table';
import { productsList } from '../../../../core/data/products.data';
import { Products } from '../../interfaces/products.model';
import { SearchService } from '../../../../core/services/search.service';
import { DataSourceInventory } from '../inventory-detail/data-source';

const ELEMENT_DATA: Products[] = productsList;

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CdkTableModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit{

  dataSource = new DataSourceInventory();
  // constructor(private searchService: SearchService) {}
  private searchService = inject(SearchService);
  injector = inject(Injector);

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

  ngOnInit(): void {
    this.dataSource.init(ELEMENT_DATA);
    this.trackSearchTerm();
  }

  trackSearchTerm(){
    effect(()=> {
      const search = this.searchService.getSearchTerm()();
      this.dataSource.searchData(search);
    }, {injector: this.injector})
  }

  delete(item: Products){
    console.log("Eliminar: ", item)
  }

  update(item: Products){
    console.log("update: ", item)
  }

}
