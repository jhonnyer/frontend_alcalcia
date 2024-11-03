import { Component, signal, computed, inject } from '@angular/core';
import { SearchService } from '../../../../core/services/search.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.scss'
})
export class InventoryFormComponent {

  private items = [
    { id: 1, name: 'Elemento 1' },
    { id: 2, name: 'Elemento 2' },
    { id: 3, name: 'Otro elemento' }
  ];

  // constructor(private searchService: SearchService) {}
  private searchService = inject(SearchService);

  filteredItems = computed(() => {
    const searchTerm = this.searchService.getSearchTerm()().toLowerCase();
    console.log("Busqueda filters ",searchTerm)
    return this.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm)
    );
  });

}
