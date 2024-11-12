import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './projects-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListComponent { }
