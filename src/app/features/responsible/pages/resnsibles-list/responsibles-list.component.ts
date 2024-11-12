import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-responsibles-list',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './responsibles-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiblesListComponent { }
