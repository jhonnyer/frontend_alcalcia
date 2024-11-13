import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';
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

  displayedColumns = input<string[]>([]);
  dataSource = new DataSourceTable();
  data = input.required<T[]>();

  ngOnInit(): void {
    this.dataSource.init(this.data());
  }

}
