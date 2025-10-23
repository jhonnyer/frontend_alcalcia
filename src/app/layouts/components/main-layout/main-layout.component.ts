import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, MatIconModule, NgIf],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  /** Sidebar abierto (modo móvil) */
  isSidebarOpen = false;

  /** Sidebar colapsado (modo escritorio) */
  isSidebarCollapsed = false;

  /** Alternar colapso en desktop */
  toggleCollapse(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  /** Abrir menú en móvil */
  openSidebar(): void {
    this.isSidebarOpen = true;
  }

  /** Cerrar menú en móvil */
  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}
