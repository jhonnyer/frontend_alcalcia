import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-error404',
  standalone: true,
  imports: [RouterLink],
  styles: ``,
  templateUrl: './error404.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Error404Component { }
