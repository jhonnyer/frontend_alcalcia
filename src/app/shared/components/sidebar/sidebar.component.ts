import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { ListInventoryComponent } from './components/list-inventory/list-inventory.component';
import { ListBeneficiaryComponent } from './components/list-beneficiary/list-beneficiary.component';
import { ListAuthComponent } from './components/list-auth/list-auth.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ListInventoryComponent, ListBeneficiaryComponent, ListAuthComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

}
