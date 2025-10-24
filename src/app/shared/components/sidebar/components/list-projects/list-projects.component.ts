import { NgClass, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-projects',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, NgClass, NgFor
  ],
  styles: ``,
  templateUrl: './list-projects.component.html',
})
export class ListProjectsComponent {
  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Registrar Proyecto', link: '/projects/create', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
    { label: 'b. Lista de Proyectos', link: '/projects', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M3 13h2v-2H3v2zm4 0h14v-2H7v2z'/></svg>` },
    { label: 'c. Agregar Beneficiario', link: '/projects/add-beneficiary/create', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
    { label: 'd. Beneficiarios de proyecto', link: '/projects/add-beneficiary/list', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M4 6h16M4 12h16M4 18h16'/></svg>` }
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

}
