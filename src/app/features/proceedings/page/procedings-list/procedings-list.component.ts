import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-procedings-list',
  standalone: true,
  imports: [
    CommonModule,
  ],
  styles: ``,
  templateUrl: './procedings-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcedingsListComponent { }
