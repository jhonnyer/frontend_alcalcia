import { DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrl: './confirm-delete-dialog.component.scss',

})
export class ConfirmDeleteDialogComponent {
  constructor(public dialog: DialogRef) {}
}
