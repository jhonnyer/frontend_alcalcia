import { Routes } from "@angular/router";
import { ProjectsListComponent } from "./pages/projects-list/projects-list.component";
import { ProjectUpdateComponent } from "./pages/project-update/project-update.component";
import { AddBeneficiaryProjectComponent } from "./pages/add-beneficiary-project/add-beneficiary-project.component";
import { BeneficiarioProyectoListComponent } from "./pages/beneficiario-proyecto-list/beneficiario-proyecto-list.component";
import { BeneficiarioProyectoUpdateComponent } from "./pages/beneficiario-proyecto-update/beneficiario-proyecto-update.component";

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    component: ProjectsListComponent
  },
  {
    path: 'create',
    component: ProjectUpdateComponent,
    data: { modo: 'crear' }
  },
  {
    path: 'update/:id',
    component: ProjectUpdateComponent,
    data: { modo: 'editar' }
  },
  {
    path: 'add-beneficiary/create',
    component: AddBeneficiaryProjectComponent
  },
  {
    path: 'add-beneficiary/list',
    component: BeneficiarioProyectoListComponent
  },
  {
    path: 'add-beneficiary/update/:id',
    component: BeneficiarioProyectoUpdateComponent
  }
]
