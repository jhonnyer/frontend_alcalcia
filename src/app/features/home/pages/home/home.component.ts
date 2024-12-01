import { Component, inject, OnInit } from '@angular/core';
import { PageTitleService } from '../../../../core/services/pageTitle.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Home');
  }
}
