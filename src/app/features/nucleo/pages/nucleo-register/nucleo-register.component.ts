import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-nucleo-register',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: 'nucleo-register.component.html',
  styleUrl: './nucleo-register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucleoRegisterComponent { }
