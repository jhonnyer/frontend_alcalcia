import { NgClass, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Registrar Proyecto', link: '/projects/create'},
    { label: 'b. Lista de Proyectos', link: '/projects'},
    { label: 'c. Agregar Beneficiario', link: '/projects/add-beneficiary/create'},
    { label: 'd. Beneficiarios de proyecto', link: '/projects/add-beneficiary/list'}
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
