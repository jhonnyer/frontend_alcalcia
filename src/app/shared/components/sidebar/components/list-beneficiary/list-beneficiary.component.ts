import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet,RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-list-beneficiary',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './list-beneficiary.component.html',
  styleUrl: './list-beneficiary.component.scss'
})
export class ListBeneficiaryComponent {

}
