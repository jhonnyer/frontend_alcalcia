import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { BehaviorSubject, Observable } from "rxjs";

export class DataSourceTable<T extends Record<string, any>> extends DataSource<T> {

  // searchData(searchTerm: string){
  //   const newT = this.originalData.filter(item => item.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
  //   this.data.next(newT);
  // }

  private data = new BehaviorSubject<T[]>([]);
  private originalData: T[] = [];

  override connect(collectionViewer: CollectionViewer): Observable<readonly T[]> {
    return this.data;
  }

  override disconnect(): void {}

  init(items: T[]) {
    this.data.next(items);
    this.originalData = items;
  }

  searchDataByColumn(searchTerm: string, column: keyof T) {
    const newT = this.originalData.filter(item => {
      const propertyValue = item[column];
      return typeof propertyValue === 'string' &&
             propertyValue.toLowerCase().includes(searchTerm.toLowerCase());
    });
    this.data.next(newT);
  }

}
