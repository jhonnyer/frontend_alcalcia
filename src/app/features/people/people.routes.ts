import { Routes } from "@angular/router";
import { PeopleListComponent } from "./pages/people-list/people-list.component";
import { PeopleDetailComponent } from "./pages/people-detail/people-detail.component";
import { PeopleFormComponent } from "./pages/people-form/people-form.component";

export const PEOPLE_ROUTES: Routes = [
  {
    path: '',
    component: PeopleListComponent
  },
  {
    path: 'detail',
    component: PeopleDetailComponent
  },
  {
    path: 'create',
    component: PeopleFormComponent
  },
  {
    path: 'update',
    component: PeopleFormComponent
  }
]
