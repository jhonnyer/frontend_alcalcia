import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Listado de Usuarios', link: 'resposibles', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }
}
