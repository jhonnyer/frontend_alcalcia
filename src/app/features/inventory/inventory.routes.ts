import { Routes } from "@angular/router";
import { InventoryDetailComponent } from "./pages/inventory-detail/inventory-detail.component";
import { InventoryFormComponent } from "./pages/inventory-form/inventory-form.component";
import { InventoryListComponent } from "./pages/inventory-list/inventory-list.component";

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: InventoryListComponent
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
