import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-responsible',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive
  ],
  styles: ``,
  templateUrl: './list-responsible.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListResponsibleComponent {
  activeMenu: boolean = false;
  @Input() collapsed = false;
}
