import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, Injector, OnInit } from '@angular/core';
import { nucleoList } from '../../../../core/data/nucleo.data';
import { Nucleo } from '../../interface/nucleo.model';
import { DataSourceNucleos } from './nucleos.datasourse';
import { SearchService } from '../../../../core/services/search.service';
import { CdkTableModule, DataSource } from '@angular/cdk/table';

@Component({
  selector: 'app-nucleos',
  standalone: true,
  imports: [CommonModule, CdkTableModule],
  templateUrl: './nucleos.component.html',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucleosComponent implements OnInit{
  dataSource = new DataSourceNucleos();
  private searchService = inject(SearchService);
  injector = inject(Injector);

  displayedColumns: string[] = [
    "id",
    "zona",
    "barrio",
    "direccion",
    "controls"
  ]
  nucleos:Nucleo[] = nucleoList;

  ngOnInit(): void {
    this.dataSource.init(this.nucleos);
    this.trackSearchTerm();
  }

  trackSearchTerm(){
    effect(()=> {
      const search = this.searchService.getSearchTerm()();
      this.dataSource.searchData(search);
    }, {injector: this.injector})
  }

  delete(item: Nucleo){
    console.log("Eliminar: ", item)
  }

  update(item: Nucleo){
    console.log("update: ", item)
  }

}
