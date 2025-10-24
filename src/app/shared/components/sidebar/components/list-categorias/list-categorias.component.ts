import { RouterLink, RouterLinkActive} from '@angular/router';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-list-categorias',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  styles: ``,
  templateUrl: './list-categorias.component.html'
})
export class ListCategoriasComponent {
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Lista de Categorías', link: 'categorias'},
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
