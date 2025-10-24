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
    { label: 'a. Registrar acta', link: 'proceedings/register', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
    { label: 'b. Listado de actas', link: 'proceedings', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M3 13h2v-2H3v2zm4 0h14v-2H7v2z'/></svg>` },
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }
  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
