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
        loadChildren: () => import('./features/nucleo/nucleo.routes').then(m=> m.NUCLEO_ROUTES)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'beneficary',
        loadChildren: () => import('./features/beneficiary/beneficiary.routes').then(m => m.BENEFICIARY_ROUTES)
      },
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      },
      {
        path: 'proceedings',
        loadChildren: () => import('./features/proceedings/procedings.routes').then(m => m.PROCEDINGS_ROUTES)
      },
      {
        path: 'projects',
        loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES)
      },
      {
        path: 'resposibles',
        loadChildren: () => import('./features/responsible/responsible.routes').then(m => m.RESPONSIBLE_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
    ]
  }
];
