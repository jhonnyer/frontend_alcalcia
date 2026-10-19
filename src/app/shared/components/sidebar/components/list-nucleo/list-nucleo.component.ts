import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgClass, NgFor } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-list-nucleo',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, OverlayModule, NgClass, NgFor, MatIconModule],
  templateUrl: './list-nucleo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListNucleoComponent implements OnInit {
  constructor(
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuGroups = [
    {
      title: 'Actores sociales',
      items: [
        { label: 'Registrar actor social', link: '/nucleo/register'},
        { label: 'Lista de actores sociales', link: '/nucleo'},
        { label: 'Carga masiva de actores sociales', link: '/nucleo/importacion-masiva'},
        { label: 'Gestionar cargas masivas', link: '/nucleo/gestionar-cargas'},
      ]
    },
    {
      title: 'Beneficiarios',
      items: [
        { label: 'Lista de beneficiarios', link: '/beneficary'},
      ]
    }
  ];

  ngOnInit(): void {
    this.activeMenu = this.router.url.startsWith('/nucleo') || this.router.url.startsWith('/beneficary');
  }

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
