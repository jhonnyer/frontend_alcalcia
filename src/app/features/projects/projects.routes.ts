import { Routes } from "@angular/router";
import { ProjectsListComponent } from "./pages/projects-list/projects-list.component";
import { ProjectCreateComponent } from "./pages/project-create/project-create.component";
import { ProjectUpdateComponent } from "./pages/project-update/project-update.component";
export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    component: ProjectsListComponent
  },
  {
    path: 'create',
    component: ProjectCreateComponent
  },
  {
    path: 'update/:id',
    component: ProjectUpdateComponent
  }
]
