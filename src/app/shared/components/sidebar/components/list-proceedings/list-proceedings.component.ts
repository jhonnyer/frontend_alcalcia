import { Component, Input } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive} from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-list-proceedings',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive,
    NgClass,
    NgFor
  ],
  styles: ``,
  templateUrl: './list-proceedings.component.html',
})
export class ListProceedingsComponent {
  constructor(
    private sanitizer: DomSanitizer
  ) {}
  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Registrar acta', link: 'proceedings/register'},
    { label: 'b. Listado de actas', link: 'proceedings'},
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }
  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
