import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, Injector, input, OnInit, output } from '@angular/core';
import { DataSourceTable } from './data-source';
import { CdkTableModule } from '@angular/cdk/table';
import { SearchService } from '../../../core/services/search.service';

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
export class TableTemplateComponent<T extends Record<string, any>> implements OnInit {

  dataSource = new DataSourceTable();

  data = input.required<T[]>();
  displayedColumns = input.required<string[]>();
  sortableColumns = input<string[]>([]);
  stickyColumns = input<string[]>([]);

  deleteItem = output<T>()
  updateItem = output<T>()
  injector = inject(Injector);
  searchService = inject(SearchService);
  columnSearch = input<string>('');


  ngOnInit(): void {
    this.dataSource.init(this.data());
    this.trackSearchTerm();
  }

  trackSearchTerm() {
    effect(() => {
      const search = this.searchService.getSearchTerm()();
      if (search) {
        // Búsqueda por columna específica o en todas as keyof T
        this.dataSource.searchDataByColumn(search, this.columnSearch());
      } else {
        this.dataSource.init(this.data());
      }
    }, {
      injector: this.injector,
      allowSignalWrites: true
    });
  }

  update(element: T){
    this.updateItem.emit(element);
  }

  delete(element: T){
    this.deleteItem.emit(element);
  }

}
