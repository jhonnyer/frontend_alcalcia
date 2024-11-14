import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-list-auth',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './list-auth.component.html',
  styleUrl: './list-auth.component.scss'
})
export class ListAuthComponent {
  activeMenu: boolean = true;
}
