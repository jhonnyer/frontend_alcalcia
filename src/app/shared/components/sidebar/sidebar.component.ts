import { Component, Input } from '@angular/core';
import { ListInventoryComponent } from './components/list-inventory/list-inventory.component';
import { ListBeneficiaryComponent } from './components/list-beneficiary/list-beneficiary.component';
import { ListHomeComponent } from './components/list-home/list-home.component';
import { ListNucleoComponent } from './components/list-nucleo/list-nucleo.component';
import { ListProceedingsComponent } from './components/list-proceedings/list-proceedings.component';
import { ListResponsibleComponent } from './components/list-responsible/list-responsible.component';
import { ListCategoriasComponent } from './components/list-categorias/list-categorias.component';
// import { ListUsersComponent } from './components/list-users/list-users.component';
import { ListProjectsComponent } from "./components/list-projects/list-projects.component";

import { HasRoleDirective } from '../../../core/directives/has-role/has-role-directive.directive';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ListHomeComponent,
    ListNucleoComponent,
    ListInventoryComponent,
    ListBeneficiaryComponent,
    // ListAuthComponent,
    ListProceedingsComponent,
    ListResponsibleComponent,
    ListProjectsComponent,
    ListCategoriasComponent,
    HasRoleDirective, 
    MatIconModule
],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() collapsed = false;
  isCollapsed = false;
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
