import { Routes } from "@angular/router";
import { ResponsiblesListComponent } from "./pages/resnsibles-list/responsibles-list.component";
import { ResponsibleUpdateComponent } from "./pages/responsible-update/responsible-update.component";
import { SupportContactComponent } from "./pages/support-contact/support-contact.component";
import { hasRoleGuard } from "../../core/guards/has-role-guard.guard";

export const RESPONSIBLE_ROUTES: Routes = [
  {
    // Disponible para cualquier usuario autenticado; la ruta padre ya valida la sesión.
    path: 'soporte',
    component: SupportContactComponent
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsiblesListComponent
  },
  {
    path: 'create',
    canActivate: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsibleUpdateComponent
  },
  {
    path: 'update/:id',
    canActivate: [hasRoleGuard],
    data: { allowedRoles: ['ADMIN'] },
    component: ResponsibleUpdateComponent
  }


]
