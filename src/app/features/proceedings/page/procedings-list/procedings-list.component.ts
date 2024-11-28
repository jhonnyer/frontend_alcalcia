import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, OnInit, signal } from '@angular/core';

import { SearchService } from '../../../../core/services/search.service';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';

import { ActasService } from '../../../../core/services/actas.service';

import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';
import { IActa } from '../../../../core/models/acta.model';
import { U } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-procedings-list',
  standalone: true,
  imports: [CommonModule, CdkTableModule, TableTemplateComponent, StepperPaginationComponent],
  styles: ``,
  templateUrl: './procedings-list.component.html'
})
export class ProcedingsListComponent implements OnInit {
  private searchService = inject(SearchService);
  injector = inject(Injector);
  private router = inject(Router);


  currentPage = 0;
  data = signal<IActa[]>([]);
  totalPage!: number;

  private actasService = inject(ActasService);

  displayedColumns: (keyof IActa | 'controls')[] = [
    'idActa',
    'fechaCreacion',
    'estado',
    'fechaEntrega',
    'ubicacionEntrega',
    'observaciones',
    'prioridad',
    'tiposSolicitud',
    'controls'
  ]

  columnSearch = 'estado';

  sorteablesColumns: string[] = [
    'fechaCreacion',
    'estado',
    'fechaEntrega'
  ]

  stickyColumns = [
    "idActa"
  ]

  ngOnInit(): void {
    this.trackSearchTerm();
    this.getAll();
  }

  getAll() {
    this.actasService.getAll().subscribe({
      next: response => {
        // console.log("All actas: ", response.content);
        this.data.set(response)
        this.totalPage = 1;
      },
      error: error => {
        console.log("Error getAll actas: ", error)
      }
    })
  }

  nextPage() {
    this.currentPage++;
    console.log("Siguiente: ", this.currentPage)
    this.getAll();
  }

  previousPage() {
    if (this.currentPage >= 0) {
      this.currentPage--;
      console.log("previo: ", this.currentPage)
      this.getAll();
    }
  }

  trackSearchTerm(){
    effect(()=> {
      const search = this.searchService.getSearchTerm()();
      // this.dataSource.searchData(search);
    }, {injector: this.injector})
  }

  delete(item: IActa){
    console.log("Eliminar: ", item)
  }

  update(item: IActa){
    console.log("update/: ", item)
    // this.router.navigate(["nucleo/update/", item.idNucleo]);
  }


}
