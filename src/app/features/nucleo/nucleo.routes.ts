import { Routes } from "@angular/router";
import { NucleosComponent } from "./pages/nucleos/nucleos.component";
import { NucleoUpdateComponent } from "./pages/nucleo-update/nucleo-update.component";
import { NucleoDetalleComponent } from "./pages/nucleo-detalle/nucleo-detalle.component";
import { DashboardComponent } from "./pages/dashboard-nucleo/dashboard-nucleo.component";
import { ImportacionMasivaComponent } from "./pages/importacion-masiva/importacion-masiva.component";
import { GestionarCargasComponent } from "./pages/gestionar-cargas/gestionar-cargas.component";

export const NUCLEO_ROUTES: Routes = [
  {
    path: '',
    component: NucleosComponent
  },
  {
    path: 'register',
    component: NucleoUpdateComponent
  },
  {
    path: 'importacion-masiva',
    component: ImportacionMasivaComponent
  },
  {
    path: 'gestionar-cargas',
    component: GestionarCargasComponent
  },
  {
    path: 'update/:id',
    component: NucleoUpdateComponent
  },
  {
    path: 'detalle/:id',
    component: NucleoDetalleComponent
  },
  {
    path: 'dashboard/:id',
    component: DashboardComponent
  },
]
