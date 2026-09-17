import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ListBeneficiaryComponent } from './components/list-beneficiary/list-beneficiary.component';
import { ListHomeComponent } from './components/list-home/list-home.component';
import { ListNucleoComponent } from './components/list-nucleo/list-nucleo.component';
import { ListProceedingsComponent } from './components/list-proceedings/list-proceedings.component';
import { ListResponsibleComponent } from './components/list-responsible/list-responsible.component';
import { ListProjectsComponent } from "./components/list-projects/list-projects.component";

import { HasRoleDirective } from '../../../core/directives/has-role/has-role-directive.directive';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgIf} from '@angular/common'

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ListHomeComponent,
    ListNucleoComponent,
    ListBeneficiaryComponent,
    ListProceedingsComponent,
    ListResponsibleComponent,
    ListProjectsComponent,
    HasRoleDirective, 
    MatIconModule,
    NgClass,
    NgIf
],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isAnimating = false;
  /** Abierto/cerrado en móviles */
  @Input() open = false;
  /** Colapsado/expandido en desktop (xl+) */
  @Input() collapsed = false;

  /** Emite cuando se cierra en móvil (para que el padre actualice el estado) */
  @Output() closed = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if ('open' in changes || 'collapsed' in changes) {
      this.isAnimating = true;              // activa bloqueo de clicks
      // fallback por si el navegador no dispara transitionend (poco probable):
      setTimeout(() => (this.isAnimating = false), 400);
    }
  }

  close() {
    this.closed.emit();
  }
}
