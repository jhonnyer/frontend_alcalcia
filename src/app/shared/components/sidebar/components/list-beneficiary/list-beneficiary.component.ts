import { NgClass, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Lista de Beneficiarios', link: 'beneficary'},
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
