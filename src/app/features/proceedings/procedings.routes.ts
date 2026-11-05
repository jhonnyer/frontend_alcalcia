import { Routes } from "@angular/router";
import { ProcedingsListComponent } from "./page/procedings-list/procedings-list.component";
import { ProcedingsRegisterComponent } from "./page/procedings-register/procedings-register.component";
import { ProcedingsUpdateComponent } from "./page/procedings-update/procedings-update.component";
import { ImportacionOperativaComponent } from "../imports/importacion-operativa.component";
import { GestionarCargasOperativasComponent } from "../imports/gestionar-cargas-operativas.component";
import { secretaryContextGuard } from "../../core/guards/secretary-context.guard";

export const PROCEDINGS_ROUTES: Routes = [
  {
    path: '',
    component: ProcedingsListComponent
  },
  {
    path: 'importacion-masiva/gestionar',
    component: GestionarCargasOperativasComponent,
    canActivate: [secretaryContextGuard],
    data: { tipoImportacion: 'ACTAS' }
  },
  {
    path: 'importacion-masiva',
    component: ImportacionOperativaComponent,
    canActivate: [secretaryContextGuard],
    canDeactivate: [(c: ImportacionOperativaComponent) => c.puedeSalir()],
    data: { tipoImportacion: 'ACTAS' }
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
