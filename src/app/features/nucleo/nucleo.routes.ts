import { Routes } from "@angular/router";
import { NucleosComponent } from "./pages/nucleo-register/nucleos/nucleos.component";
import { NucleoRegisterComponent } from "./pages/nucleo-register/nucleo-register.component";

export const NUCLEO_ROUTES: Routes = [
  {
    path: '',
    component: NucleosComponent
  },
  {
    path: 'register',
    component: NucleoRegisterComponent
  }
]
