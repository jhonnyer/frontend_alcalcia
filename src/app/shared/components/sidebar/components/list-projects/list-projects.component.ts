import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet,RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-projects',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive
  ],
  styles: ``,
  templateUrl: './list-projects.component.html',
})
export class ListProjectsComponent {
  activeMenu: boolean = false;
}
