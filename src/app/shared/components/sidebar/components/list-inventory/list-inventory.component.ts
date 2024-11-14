import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-list-inventory',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './list-inventory.component.html',
  styleUrl: './list-inventory.component.scss'
})
export class ListInventoryComponent {
  activeMenu: boolean = true;

}
