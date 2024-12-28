import { Routes } from "@angular/router";
import { ResponsiblesListComponent } from "./pages/resnsibles-list/responsibles-list.component";
import { ResponsibleCreateComponent } from "./pages/responsible-create/responsible-create.component";
import { ResponsibleUpdateComponent } from "./pages/responsible-update/responsible-update.component";
import { hasRoleGuard } from "../../core/guards/has-role-guard.guard";

export const RESPONSIBLE_ROUTES: Routes = [
  {
    path: '',
    canMatch: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsiblesListComponent
  },
  {
    path: 'create',
    canMatch: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsibleCreateComponent
  },
  {
    path: 'update/:id',
    canMatch: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsibleUpdateComponent
  }


]
