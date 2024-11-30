import { RouterLink, RouterLinkActive} from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-categorias',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: ``,
  templateUrl: './list-categorias.component.html'
})
export class ListCategoriasComponent {
  activeMenu: boolean = false;
}
