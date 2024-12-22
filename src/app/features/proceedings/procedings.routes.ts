import { Routes } from "@angular/router";
import { ProcedingsListComponent } from "./page/procedings-list/procedings-list.component";
import { ProcedingsRegisterComponent } from "./page/procedings-register/procedings-register.component";
import { ProcedingsUpdateComponent } from "./page/procedings-update/procedings-update.component";

export const PROCEDINGS_ROUTES: Routes = [
  {
    path: '',
    component: ProcedingsListComponent
  },
  {
    path: 'register',
    component: ProcedingsRegisterComponent
  },
  {
    path: 'update/:id',
    component: ProcedingsUpdateComponent
  }
]
