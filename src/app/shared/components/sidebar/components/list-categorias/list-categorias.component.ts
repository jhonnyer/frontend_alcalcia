import { RouterLink, RouterLinkActive} from '@angular/router';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-categorias',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  styles: ``,
  templateUrl: './list-categorias.component.html'
})
export class ListCategoriasComponent {
  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Lista de Categorías', link: 'categorias', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }
}
