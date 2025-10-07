import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { unauthenticatedGuard } from "../../core/guards/unauthenticated.guard";

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [unauthenticatedGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [unauthenticatedGuard]
  }
]
