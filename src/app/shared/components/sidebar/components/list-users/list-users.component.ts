import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive
  ],
  styles: ``,
  templateUrl: './list-users.component.html'
})
export class ListUsersComponent {
  activeMenu: boolean = true;

}
