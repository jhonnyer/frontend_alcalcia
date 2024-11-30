import { Routes } from "@angular/router";
import { CategoriasListComponent } from './categorias-list/categorias-list.component';
import { CategoriasCreateComponent } from "./categorias-create/categorias-create.component";
import { CategoriasUpdateComponent } from "./categorias-update/categorias-update.component";

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    component: CategoriasListComponent
  },
  {
    path: 'create',
    component: CategoriasCreateComponent
  },
  {
    path: 'update/:id',
    component: CategoriasUpdateComponent
  }
]
