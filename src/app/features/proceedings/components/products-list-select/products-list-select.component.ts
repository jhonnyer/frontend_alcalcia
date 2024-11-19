import { Component, inject, OnInit } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

interface OutputData {
  rta: string;
}

@Component({
  selector: 'app-products-list-select',
  standalone: true,
  imports: [],
  styles: ``,
  templateUrl: './products-list-select.component.html'
})
export class ProductsListSelectComponent implements OnInit{

  data = inject(DIALOG_DATA);
  dialogRef = inject<DialogRef<OutputData>>(DialogRef<OutputData>);

  ngOnInit(): void {
    console.log(this.data)
  }

  close() {
    this.dialogRef.close();
  }

  closeWithRta() {
    this.dialogRef.close({rta:'pizza'});
  }
}
