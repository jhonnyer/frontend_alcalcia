import { RouterLink, RouterLinkActive} from '@angular/router';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-categorias',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  styles: ``,
  templateUrl: './list-categorias.component.html'
})
export class ListCategoriasComponent {
  activeMenu: boolean = false;
  @Input() collapsed = false;
}
