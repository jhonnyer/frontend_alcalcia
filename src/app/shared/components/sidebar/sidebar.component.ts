import { Component } from '@angular/core';
import { ListInventoryComponent } from './components/list-inventory/list-inventory.component';
import { ListBeneficiaryComponent } from './components/list-beneficiary/list-beneficiary.component';
import { ListAuthComponent } from './components/list-auth/list-auth.component';
import { ListHomeComponent } from './components/list-home/list-home.component';
import { ListNucleoComponent } from './components/list-nucleo/list-nucleo.component';
import { ListProceedingsComponent } from './components/list-proceedings/list-proceedings.component';
import { ListResponsibleComponent } from './components/list-responsible/list-responsible.component';
import { ListCategoriasComponent } from './components/list-categorias/list-categorias.component';
// import { ListUsersComponent } from './components/list-users/list-users.component';
import { ListProjectsComponent } from "./components/list-projects/list-projects.component";
import { ShowForRolesDirective } from '../../../core/directives/show-for-roles.directive';
import { HidenForRolesDirectiveDirective } from '../../../core/directives/hiden-for-roles-directive.directive';

import { HasRoleDirective } from '../../../core/directives/has-role/has-role-directive.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ListHomeComponent,
    ListNucleoComponent,
    ListInventoryComponent,
    ListBeneficiaryComponent,
    ListAuthComponent,
    ListProceedingsComponent,
    ListResponsibleComponent,
    ListProjectsComponent,
    ListCategoriasComponent,
],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

}
