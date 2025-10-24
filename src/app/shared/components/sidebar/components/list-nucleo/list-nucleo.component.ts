import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgClass, NgFor } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-list-nucleo',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, OverlayModule, NgClass, NgFor],
  templateUrl: './list-nucleo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListNucleoComponent {
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuItems = [
    { label: 'a. Registrar Núcleo Familiar', link: 'nucleo/register'},
    { label: 'b. Núcleos Familiares', link: '/nucleo'},
  ];

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
