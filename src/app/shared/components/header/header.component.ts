import { Component, inject, OnInit, signal } from '@angular/core';
import { SearchService } from '../../../core/services/search.service';
import { PageTitleService } from '../../../core/services/pageTitle.service';
import { TokenService } from '../../../core/services/token.service';
import { Router } from '@angular/router';
import {
  CdkMenu,
  CdkMenuTrigger,
  CdkMenuItem,
  CdkMenuBar,
} from '@angular/cdk/menu';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CdkMenuBar,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkMenu,
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  public searchService = inject(SearchService);
  public pageTitleService = inject(PageTitleService);
  public tokenService = inject(TokenService);
  public route = inject(Router);
  public userRole = signal<string | null>(null);

  loginUser: boolean = false;

  searchTerm = this.searchService.getSearchTerm();

  roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    RESP: 'Responsable',
    USER: 'Usuario',
    BENEF: 'Beneficiario'
  };

  ngOnInit(): void {
    this.loginState();
    this.loadUserRole();
  }

  loginState(){
    // Primero verificar si el usuario está logueado (token no expirado)
    this.userRole.set(this.tokenService.getUserRole());
    this.loginUser = !this.tokenService.getToken();
  }

  logout(){
    this.tokenService.clearToken();
    this.route.navigate(['/auth']);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchService.updateSearchTerm(target.value);
  }

  private loadUserRole(): void {
    const role = this.tokenService.getUserRole(); // ejemplo: "ADMIN" o "RESP"
    this.userRole.set(role);
  }

  goHome(): void {
    this.route.navigate(['/home']);
  }
}
