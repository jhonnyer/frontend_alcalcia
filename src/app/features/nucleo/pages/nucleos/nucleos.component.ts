import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-nucleos',
  standalone: true,
  imports: [
    CommonModule,
  ],
  template: `<p>nucleos works!</p>`,
  styleUrl: './nucleos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucleosComponent { }
