import { Routes } from "@angular/router";
import { NucleosComponent } from "./pages/nucleos/nucleos.component";
import { NucleoRegisterComponent } from "./pages/nucleo-register/nucleo-register.component";
import { NucleoUpdateComponent } from "./pages/nucleo-update/nucleo-update.component";

export const NUCLEO_ROUTES: Routes = [
  {
    path: '',
    component: NucleosComponent
  },
  {
    path: 'register',
    component: NucleoRegisterComponent
  },
  {
    path: 'update/:id',
    component: NucleoUpdateComponent
  },
]
