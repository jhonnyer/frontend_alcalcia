import { Routes } from "@angular/router";
import { ResponsiblesListComponent } from "./pages/resnsibles-list/responsibles-list.component";
import { ResponsibleCreateComponent } from "./pages/responsible-create/responsible-create.component";

export const RESPONSIBLE_ROUTES: Routes = [
  {
    path: '',
    component: ResponsiblesListComponent
  },
  {
    path: 'create',
    component: ResponsibleCreateComponent
  }

]
