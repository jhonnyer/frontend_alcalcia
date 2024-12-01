import { Injectable, signal  } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {

  // Signal para la página actual
  currentPage = signal('Página Actual');

  // Método para actualizar la página actual
  setCurrentPage(pageName: string) {
    this.currentPage.set(pageName);
  }

  getCurrentPage(): string {
    return this.currentPage();
  }

}
