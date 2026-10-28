import { Router, Routes } from "@angular/router";
import { inject } from "@angular/core";
import { CategoriasCreateComponent } from "./categorias-create/categorias-create.component";

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ({ queryParams }) => inject(Router).createUrlTree(['/inventory'], {
      queryParams: { ...queryParams, vista: 'categorias' }
    })
  },
  {
    path: 'create',
    component: CategoriasCreateComponent
  },
  {
    path: 'update/:id',
    component: CategoriasCreateComponent
  }
]
