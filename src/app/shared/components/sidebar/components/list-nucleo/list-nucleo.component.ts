import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'app-list-nucleo',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, OverlayModule],
  templateUrl: './list-nucleo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListNucleoComponent {
  activeMenu: boolean = true;
}
