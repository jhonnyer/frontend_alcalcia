import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive} from '@angular/router';

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
export class ListResponsibleComponent implements OnInit {
  constructor(
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuGroups = [
    {
      title: 'Administración',
      items: [
        { label: 'Panel administrativo', link: '/users'},
        { label: 'Usuarios y responsables', link: '/resposibles'}
      ]
    }
  ];

  ngOnInit(): void {
    this.activeMenu = this.router.url.startsWith('/users') || this.router.url.startsWith('/resposibles');
  }

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
