import { Routes } from "@angular/router";
import { BeneficiaryListComponent } from "./pages/beneficiary-list/beneficiary-list.component";
import { BeneficiaryUpdateComponent } from './pages/beneficiary-update/beneficiary-update.component';

export const BENEFICIARY_ROUTES: Routes = [
  {
    path: '',
    component: BeneficiaryListComponent
  },
  {
    path: 'update/:id',
    component: BeneficiaryUpdateComponent
  }
]
