import { Routes } from "@angular/router";
import { BeneficiaryListComponent } from "./pages/beneficiary-list/beneficiary-list.component";
import { BeneficiaryRegisterComponent } from "./pages/beneficiary-register/beneficiary-register.component";

export const BENEFICIARY_ROUTES: Routes = [
  {
    path: '',
    component: BeneficiaryListComponent
  },
  {
    path: 'register',
    component: BeneficiaryRegisterComponent
  }
]
