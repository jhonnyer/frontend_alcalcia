import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/components/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES)
      },
      {
        path: 'nucleo',
        loadChildren: () => import('./features/nucleo/nucleo.routes').then(m => m.NUCLEO_ROUTES)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'people',
        loadChildren: () => import('./features/people/people.routes').then(m => m.PEOPLE_ROUTES)
      },
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      },

    ]
  }
];
