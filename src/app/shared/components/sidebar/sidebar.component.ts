import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ListInventoryComponent } from './components/list-inventory/list-inventory.component';
import { ListBeneficiaryComponent } from './components/list-beneficiary/list-beneficiary.component';
import { ListHomeComponent } from './components/list-home/list-home.component';
import { ListNucleoComponent } from './components/list-nucleo/list-nucleo.component';
import { ListProceedingsComponent } from './components/list-proceedings/list-proceedings.component';
import { ListResponsibleComponent } from './components/list-responsible/list-responsible.component';
import { ListCategoriasComponent } from './components/list-categorias/list-categorias.component';
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
    ListInventoryComponent,
    ListBeneficiaryComponent,
    ListProceedingsComponent,
    ListResponsibleComponent,
    ListProjectsComponent,
    ListCategoriasComponent,
    HasRoleDirective, 
    MatIconModule,
    NgClass,
    NgIf
],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  /** Abierto/cerrado en móviles */
  @Input() open = false;
  /** Colapsado/expandido en desktop (xl+) */
  @Input() collapsed = false;

  /** Emite cuando se cierra en móvil (para que el padre actualice el estado) */
  @Output() closed = new EventEmitter<void>();

  close() {
    this.open = false;
    this.closed.emit();
  }
}
