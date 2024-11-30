import { Routes } from "@angular/router";
import { CategoriaListComponent } from "./categoria-list/categoria-list.component";
import { CategoriasCreateComponent } from "./categorias-create/categorias-create.component";
import { CategoriasUpdateComponent } from "./categorias-update/categorias-update.component";

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    component: CategoriaListComponent
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
