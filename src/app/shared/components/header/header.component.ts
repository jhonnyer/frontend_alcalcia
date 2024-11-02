import { Component, inject } from '@angular/core';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  public searchService = inject(SearchService);
  searchTerm = this.searchService.getSearchTerm();

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchService.updateSearchTerm(target.value);
  }
}
