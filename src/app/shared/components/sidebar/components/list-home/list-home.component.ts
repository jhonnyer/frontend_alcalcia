import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-list-home',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './list-home.component.html'
})
export class ListHomeComponent { 
  @Input() collapsed = false;
}
