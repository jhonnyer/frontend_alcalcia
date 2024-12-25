import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/components/main-layout/main-layout.component';
import { Error404Component } from './shared/components/error404/error404.component';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { UserInactiveComponent } from './shared/components/userInactive/userInactive.component';

import { authGuard } from './core/guards/auth.guard'; // Vieja

import { roleGuard } from './core/guards/role.guard';
import { authenticationGuard } from './core/guards/authentication.guard';
import { unauthenticatedGuard } from './core/guards/unauthenticated.guard';
import { hasRoleGuard } from './core/guards/has-role-guard.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canMatch: [authenticationGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: 'home',
        loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES)
      },
      {

        path: 'nucleo',
        canActivate: [hasRoleGuard],
        data: { allowedRoles: ['ADMIN', 'RESP'] },
        loadChildren: () => import('./features/nucleo/nucleo.routes').then(m=> m.NUCLEO_ROUTES)
      },
      {
        path: 'inventory',
        canActivate: [hasRoleGuard],
        data: { allowedRoles: ['ADMIN'] },
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'beneficary',
        loadChildren: () => import('./features/beneficiary/beneficiary.routes').then(m => m.BENEFICIARY_ROUTES)
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
        path: 'categorias',
        loadChildren: () => import('./features/categorias/categorias.routes').then(m => m.CATEGORIAS_ROUTES)
      },
      {
        path: 'resposibles',
        loadChildren: () => import('./features/responsible/responsible.routes').then(m => m.RESPONSIBLE_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
      { path: 'no-autorizado', component: UnauthorizedComponent },
      { path: 'user-inactive', component: UserInactiveComponent},
      { path: '**', component: Error404Component }
    ]
  },
  { path: 'user-inactive', component: UserInactiveComponent}
];
