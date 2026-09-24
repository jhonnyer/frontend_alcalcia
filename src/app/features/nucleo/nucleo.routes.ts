import { Routes } from "@angular/router";
import { NucleosComponent } from "./pages/nucleos/nucleos.component";
import { NucleoUpdateComponent } from "./pages/nucleo-update/nucleo-update.component";
import { NucleoDetalleComponent } from "./pages/nucleo-detalle/nucleo-detalle.component";
import { DashboardComponent } from "./pages/dashboard-nucleo/dashboard-nucleo.component";
import { ImportacionMasivaComponent } from "./pages/importacion-masiva/importacion-masiva.component";

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
