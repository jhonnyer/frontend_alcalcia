import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { BehaviorSubject, Observable } from "rxjs";
import { Products } from "../../../../core/models/products.model";

export class DataSourceInventory extends DataSource<Products> {
  data = new BehaviorSubject<Products[]>([]);
  originalData: Products[] = [];

  override connect(collectionViewer: CollectionViewer): Observable<readonly Products[]> {
    return this.data;
  }

  override disconnect(): void {}

  init(products: Products[]) {
    this.data.next(products);
    this.originalData=products;
  }

  searchData(searchTerm: string){
    const newProducts = this.originalData.filter(item => item.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
    this.data.next(newProducts);
  }

}
