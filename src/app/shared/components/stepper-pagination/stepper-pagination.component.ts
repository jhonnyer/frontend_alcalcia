import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

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
  currentPage = 1;

  // updateItem = output<T>()
  next = output();
  previus = output();

  nextPage() {
    if(this.currentPage < this.endPage()){
      this.currentPage++;
      this.next.emit();
    }
  }

  previousPage() {
    if(this.currentPage>1){
      this.currentPage--
      this.previus.emit();
    }
  }

}
