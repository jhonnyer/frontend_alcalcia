import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet,RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-responsible',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet,RouterLink, RouterLinkActive
  ],
  styles: ``,
  templateUrl: './list-responsible.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListResponsibleComponent { }
