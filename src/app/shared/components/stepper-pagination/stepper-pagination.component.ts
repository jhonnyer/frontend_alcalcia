import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stepper-pagination',
  standalone: true,
  imports: [
    CommonModule,
  ],
  styleUrls: ['./stepper-pagination.component.scss'],
  templateUrl: './stepper-pagination.component.html'
})
export class StepperPaginationComponent {
  initPage = input.required<number>();
  endPage = input.required<number>();


}
