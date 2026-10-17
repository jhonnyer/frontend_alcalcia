import { Routes } from "@angular/router";
import { ResponsiblesListComponent } from "./pages/resnsibles-list/responsibles-list.component";
import { ResponsibleCreateComponent } from "./pages/responsible-create/responsible-create.component";
import { ResponsibleUpdateComponent } from "./pages/responsible-update/responsible-update.component";
import { SupportContactComponent } from "./pages/support-contact/support-contact.component";
import { hasRoleGuard } from "../../core/guards/has-role-guard.guard";

export const RESPONSIBLE_ROUTES: Routes = [
  {
    path: 'soporte',
    canActivate: [hasRoleGuard],
    data: { allowedRoles: ['RESP', 'ADMIN', 'SUPERADMIN', 'USER', 'BENEF'] },
    component: SupportContactComponent
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN', 'SUPERADMIN'] },
    component: ResponsiblesListComponent
  },
  {
    path: 'create',
    canActivate: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsibleCreateComponent
  },
  {
    path: 'update/:id',
    canActivate: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsibleUpdateComponent
  }


]
