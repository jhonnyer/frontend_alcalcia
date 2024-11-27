import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive
  ],
  styles: ``,
  templateUrl: './list-users.component.html'
})
export class ListUsersComponent {
  activeMenu: boolean = false;

}
