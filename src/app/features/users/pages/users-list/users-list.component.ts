import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: `./users-list.component.html`,
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent { }
