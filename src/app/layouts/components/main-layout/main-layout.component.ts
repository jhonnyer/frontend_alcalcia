import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, MatIconModule, NgClass, NgIf],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isSidebarOpen = true;         // sidebar visible por defecto en desktop
  isSidebarCollapsed = false;   // bandera lógica para manejar expansión
  isMobileView = false;         // detecta vista móvil

  constructor() {
    this.checkViewport();
  }

  /** Escucha cambios de tamaño de ventana */
  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  /** Detectar si es vista móvil */
  private checkViewport(): void {
    this.isMobileView = window.innerWidth < 1280; // breakpoint xl
    if (this.isMobileView) {
      this.isSidebarOpen = false;
    } else {
      this.isSidebarOpen = !this.isSidebarCollapsed;
    }
  }

  /** Alternar sidebar en desktop */
  toggleCollapse(): void {
    if (this.isMobileView) {
      this.isSidebarOpen = !this.isSidebarOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      this.isSidebarOpen = !this.isSidebarCollapsed;
    }
  }

  openSidebar(): void {
    this.isSidebarOpen = true;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}
