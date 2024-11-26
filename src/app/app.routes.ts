import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/components/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full'
      },
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      },
      {
        path: 'home',
        canActivate: [authGuard],
        loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES)
      },
      {

        path: 'nucleo',
        canActivate: [authGuard],
        data: { role: 'ADMIN' },
        loadChildren: () => import('./features/nucleo/nucleo.routes').then(m=> m.NUCLEO_ROUTES)
      },
      {
        path: 'inventory',
        canActivate: [authGuard],
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'beneficary',
        canActivate: [authGuard],
        loadChildren: () => import('./features/beneficiary/beneficiary.routes').then(m => m.BENEFICIARY_ROUTES)
      },
      {
        path: 'proceedings',
        canActivate: [authGuard],
        loadChildren: () => import('./features/proceedings/procedings.routes').then(m => m.PROCEDINGS_ROUTES)
      },
      {
        path: 'projects',
        canActivate: [authGuard],
        loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES)
      },
      {
        path: 'resposibles',
        canActivate: [authGuard],
        loadChildren: () => import('./features/responsible/responsible.routes').then(m => m.RESPONSIBLE_ROUTES)
      },
      {
        path: 'users',
        canActivate: [authGuard],
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
    ]
  }
];
