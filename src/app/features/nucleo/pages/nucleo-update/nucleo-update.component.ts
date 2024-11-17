import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-nucleo-update',
  standalone: true,
  imports: [
    CommonModule,
  ],
  styles: ``,
  templateUrl: './nucleo-update.component.html',
})
export class NucleoUpdateComponent implements OnInit{
  @Input('id') productId!: string;

  ngOnInit(): void {
    console.log(this.productId)
  }



}
