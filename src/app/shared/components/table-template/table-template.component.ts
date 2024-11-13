import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, OnInit, output } from '@angular/core';
import { DataSourceTable } from './data-source';
import { CdkTableModule } from '@angular/cdk/table';

@Component({
  selector: 'app-table-template',
  standalone: true,
  imports: [
    CommonModule, CdkTableModule
  ],
  styles: ``,
  templateUrl: './table-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableTemplateComponent<T> implements OnInit {

  dataSource = new DataSourceTable();

  data = input.required<T[]>();
  displayedColumns = input.required<string[]>();
  sortableColumns = input<string[]>([]);
  stickyColumns = input<string[]>([]);

  deleteItem = output<T>()
  updateItem = output<T>()
  injector: any;
  searchService: any;


  ngOnInit(): void {
    this.dataSource.init(this.data());
  }

  trackSearchTerm(){
    effect(()=> {
      const search = this.searchService.getSearchTerm()();
      console.log(search)
      // this.dataSource.searchDataByColumn('categoria', 'higiene');
    }, {
      injector: this.injector,
      allowSignalWrites: true  // Añadir esta opción
    })
  }

  update(element: T){
    this.updateItem.emit(element);
  }

  delete(element: T){
    this.deleteItem.emit(element);
  }

}
