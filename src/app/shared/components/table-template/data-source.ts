import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { BehaviorSubject, Observable } from "rxjs";


export class DataSourceTable<T> extends DataSource<T> {
  data = new BehaviorSubject<T[]>([]);
  originalData: T[] = [];

  override connect(collectionViewer: CollectionViewer): Observable<readonly T[]> {
    return this.data;
  }

  override disconnect(): void {}

  init(T: T[]) {
    this.data.next(T);
    this.originalData=T;
  }

  // searchData(searchTerm: string){
  //   const newT = this.originalData.filter(item => item.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
  //   this.data.next(newT);
  // }

  searchDataByColumn<K extends keyof T>(searchTerm: string, column: K) {
    const newT = this.originalData.filter(item => {
      const propertyValue = item[column];
      return typeof propertyValue === 'string' && propertyValue.toLowerCase().includes(searchTerm.toLowerCase());
    });
    this.data.next(newT);
  }

}
