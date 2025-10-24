import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-list-inventory',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './list-inventory.component.html',
  styleUrl: './list-inventory.component.scss'
})
export class ListInventoryComponent {
  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Ingresar Productos', link: 'inventory/create', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
    { label: 'b. Lista de Productos', link: 'inventory', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }
}
