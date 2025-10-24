import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-responsible',
  standalone: true,
  imports: [
    RouterLink, 
    RouterLinkActive,
    NgClass,
    NgFor
  ],
  styles: ``,
  templateUrl: './list-responsible.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListResponsibleComponent {
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Listado de Usuarios', link: 'resposibles'},
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
