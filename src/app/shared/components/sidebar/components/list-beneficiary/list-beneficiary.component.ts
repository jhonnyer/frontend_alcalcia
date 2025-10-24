import { NgClass, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-beneficiary',
  standalone: true,
  imports: [
    RouterLink, 
    RouterLinkActive,
    NgClass,
    NgFor
  ],
  templateUrl: './list-beneficiary.component.html',
  styleUrl: './list-beneficiary.component.scss'
})
export class ListBeneficiaryComponent {
  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Lista de Beneficiarios', link: 'beneficary', icon: `<svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24'><path d='M12 4v16m8-8H4'/></svg>` },
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }
}
