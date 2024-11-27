import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-error404',
  standalone: true,
  imports: [],
  template: `
    <div class="error-container">
      <h1>Página no encontrada</h1>
      <p>Lo sentimos, la página que estás buscando no existe.</p>
      <a routerLink="/">Volver al inicio</a>
    </div>
  `,
  styleUrl: './error404.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Error404Component { }
