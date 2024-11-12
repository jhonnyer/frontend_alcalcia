import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { BehaviorSubject, Observable } from "rxjs";
import { Nucleo } from "../../interface/nucleo.model";

export class DataSourceNucleos extends DataSource<Nucleo> {
  data = new BehaviorSubject<Nucleo[]>([]);
  originalData: Nucleo[] = [];

  override connect(collectionViewer: CollectionViewer): Observable<readonly Nucleo[]> {
    return this.data;
  }

  override disconnect(): void {}

  init(nucleos: Nucleo[]) {
    this.data.next(nucleos);
    this.originalData=nucleos;
  }

  searchData(searchTerm: string){
    console.log(searchTerm)
    const newNucleos = this.originalData.filter(item => item.barrio.toLowerCase().includes(searchTerm.toLowerCase()));
    this.data.next(newNucleos);
  }

}
