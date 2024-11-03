import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchTerm = signal<string>('');

   // Getter para el término de búsqueda
   getSearchTerm() {
    return this.searchTerm;
  }

  // Método para actualizar el término de búsqueda
  updateSearchTerm(term: string) {
    console.log("SERVICIO: ", term);
    this.searchTerm.set(term);
  }
}
