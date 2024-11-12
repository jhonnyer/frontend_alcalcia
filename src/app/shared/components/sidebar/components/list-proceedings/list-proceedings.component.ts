import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet,RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-proceedings',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive
  ],
  styles: ``,
  templateUrl: './list-proceedings.component.html',
})
export class ListProceedingsComponent { }
