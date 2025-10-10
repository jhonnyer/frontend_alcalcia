import { Routes } from "@angular/router";
import { NucleosComponent } from "./pages/nucleos/nucleos.component";
import { NucleoUpdateComponent } from "./pages/nucleo-update/nucleo-update.component";
import { NucleoDetalleComponent } from "./pages/nucleo-detalle/nucleo-detalle.component";

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
    path: 'update/:id',
    component: NucleoUpdateComponent
  },
  {
    path: 'detalle/:id',
    component: NucleoDetalleComponent
  },
]
