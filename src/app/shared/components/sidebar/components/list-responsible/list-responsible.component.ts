import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive} from '@angular/router';
import { TokenService } from '../../../../../core/services/token.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-list-responsible',
  standalone: true,
  imports: [
    RouterLink, 
    RouterLinkActive,
    NgClass,
    NgFor,
    MatIconModule
  ],
  styles: ``,
  templateUrl: './list-responsible.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListResponsibleComponent implements OnInit {
  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private tokenService: TokenService
  ) {}

  activeMenu: boolean = false;
  @Input() collapsed = false;
  menuGroups = [
    {
      title: 'Administración',
      items: [] as { label: string; link: string }[]
    }
  ];

  ngOnInit(): void {
    const role = (this.tokenService.getUserRole() || '').toUpperCase();
    this.menuGroups = [
      {
        title: role === 'SUPERADMIN' ? 'SuperAdmin' : 'Administración',
        items: role === 'SUPERADMIN'
          ? [
              { label: 'Gestión de secretarías', link: '/users' },
              { label: 'Contactos de responsables', link: '/resposibles' },
              { label: 'Soporte administrativo', link: '/resposibles/soporte' }
            ]
          : role === 'RESP'
            ? [
                { label: 'Soporte administrativo', link: '/resposibles/soporte' }
              ]
            : [
                { label: 'Panel administrativo', link: '/users' },
                { label: 'Usuarios y responsables', link: '/resposibles' },
                { label: 'Soporte administrativo', link: '/resposibles/soporte' }
              ]
      }
    ];

    this.activeMenu = this.router.url.startsWith('/users')
      || this.router.url.startsWith('/resposibles');
  }

  toggleMenu() {
    if (!this.collapsed) this.activeMenu = !this.activeMenu;
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
