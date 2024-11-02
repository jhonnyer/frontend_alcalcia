import { Component, inject, computed } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { productsList } from '../../../../core/data/products.data';
import { Products } from '../../interfaces/products.model';
import { SearchService } from '../../../../core/services/search.service';

const ELEMENT_DATA: Products[] = productsList;

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CdkTableModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent {
  private searchService = inject(SearchService);
  searchTerm = this.searchService.getSearchTerm();

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

  // Signal computado para filtrar elementos
  filteredItems = computed(() => {
    const searchTerm = this.searchService.getSearchTerm()().toLowerCase();
    console.log(searchTerm);
    this.dataSource.filter(item =>
      item.codigo.toLowerCase().includes(searchTerm)
    );
    console.log(this.dataSource);

  });
}
