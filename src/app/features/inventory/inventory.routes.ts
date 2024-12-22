import { Routes } from "@angular/router";
import { InventoryDetailComponent } from "./pages/inventory-detail/inventory-detail.component";
import { InventoryCreateComponent } from "./pages/inventory-create/inventory-create.component";
import { InventoryFormComponent } from "./pages/inventory-form/inventory-form.component";
import { InventoryListComponent } from "./pages/inventory-list/inventory-list.component";
import { InventoryUpdateComponent } from "./pages/inventory-update/inventory-update.component";

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: InventoryListComponent
  },
  {
    path: 'create',
    component: InventoryCreateComponent
  },
  {
    path: 'update/:id',
    component: InventoryUpdateComponent
  },

  {
    path: 'detail',
    component: InventoryDetailComponent
  },
  {
    path: 'input',
    component: InventoryFormComponent
  },
  {
    path: 'output',
    component: InventoryFormComponent
  }
]
