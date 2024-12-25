import { Component, inject, OnInit, signal } from '@angular/core';
import { SearchService } from '../../../core/services/search.service';
import { PageTitleService } from '../../../core/services/pageTitle.service';
import { TokenService } from '../../../core/services/token.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import {
  CdkMenuItemRadio,
  CdkMenuItemCheckbox,
  CdkMenuGroup,
  CdkMenu,
  CdkMenuTrigger,
  CdkMenuItem,
  CdkMenuBar,
} from '@angular/cdk/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CdkMenuBar,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkMenu,
    RouterLink
    // CdkMenuGroup,
    // CdkMenuItemCheckbox,
    // CdkMenuItemRadio,
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

  ngOnInit(): void {
    console.log(this.pageTitleService.getCurrentPage());
    this.loginState();
  }

  loginState(){
    // Primero verificar si el usuario está logueado (token no expirado)
    this.userRole.set(this.tokenService.getUserRole());
    // console.log("RALANDO",this.userRole());
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
}
