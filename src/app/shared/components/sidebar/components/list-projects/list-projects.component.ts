import { NgClass, NgFor } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-projects',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, NgClass, NgFor
  ],
  styles: ``,
  templateUrl: './list-projects.component.html',
})
export class ListProjectsComponent implements OnInit {
  constructor(
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuGroups = [
    {
      title: 'Gestión',
      items: [
        { label: 'Registrar proyecto', link: '/projects/create'},
        { label: 'Lista de proyectos', link: '/projects'}
      ]
    },
    {
      title: 'Beneficiarios',
      items: [
        { label: 'Asignar beneficiario', link: '/projects/add-beneficiary/create'},
        { label: 'Beneficiarios por proyecto', link: '/projects/add-beneficiary/list'}
      ]
    },
    {
      title: 'Inventario',
      items: [
        { label: 'Categorías por proyecto', link: '/categorias'},
        { label: 'Inventario por proyecto', link: '/inventory'},
        { label: 'Agregar productos', link: '/inventory/create'}
      ]
    }
  ];

  ngOnInit(): void {
    this.activeMenu = this.router.url.startsWith('/projects') || this.router.url.startsWith('/inventory') || this.router.url.startsWith('/categorias');
  }

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
