import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive} from '@angular/router';

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
  @Input() collapsed = false;
}
