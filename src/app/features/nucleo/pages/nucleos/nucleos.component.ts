import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, Injector, OnInit, signal } from '@angular/core';

import { SearchService } from '../../../../core/services/search.service';
import { CdkTableModule } from '@angular/cdk/table';
import { Router } from '@angular/router';

import { NucleoService } from '../../../../core/services/nucleo.service';

import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
import { StepperPaginationComponent } from '../../../../shared/components/stepper-pagination/stepper-pagination.component';
import { INucleoUpdate } from '../../../../core/models/nucleo.model';

@Component({
  selector: 'app-nucleos',
  standalone: true,
  imports: [CommonModule, CdkTableModule, TableTemplateComponent, StepperPaginationComponent],
  templateUrl: './nucleos.component.html',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucleosComponent implements OnInit{
  private searchService = inject(SearchService);
  injector = inject(Injector);
  private router = inject(Router);


  currentPage = 0;
  data = signal<INucleoUpdate[]>([]);
  totalPage!: number;

  private nucleoService = inject(NucleoService);

  displayedColumns: (keyof INucleoUpdate | 'controls')[] = [
    'idNucleo',
    'nombreNucleo',
    'direccion',
    'idZonaFk',
    'numeroIntegrantes',
    'controls'
  ]

  columnSearch = 'nombreNucleo';

  sorteablesColumns: string[] = [
    'idNucleo',
    'nombreNucleo',
    'direccion',
    'idZonaFk',
    'numeroIntegrantes',
  ]

  stickyColumns = [
    "codigo"
  ]

  ngOnInit(): void {
    this.trackSearchTerm();
    this.getAll();
  }

  getAll() {
    this.nucleoService.getAll(this.currentPage).subscribe({
      next: response => {
        // console.log("All Nucleos: ", response.content);
        this.data.set(response.content)
        this.totalPage = response.totalPages;
      },
      error: error => {
        console.log("Error getAll nucleos: ", error)
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

  delete(item: INucleoUpdate){
    console.log("Eliminar: ", item)
  }

  update(item: INucleoUpdate){
    console.log("update/: ", item)
    this.router.navigate(["nucleo/update/", item.idNucleo]);
  }
}
