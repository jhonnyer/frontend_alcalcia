import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { BehaviorSubject, Observable } from "rxjs";
import { Products } from '../../interfaces/products.model';

export class DataSourceInventory extends DataSource<Products> {
  data = new BehaviorSubject<Products[]>([]);
  dataSource: Products[] = [];

  override connect(collectionViewer: CollectionViewer): Observable<readonly Products[]> {
    return this.data;
  }

  override disconnect(): void {}

  init(products: Products[]) {
    this.data.next(products);
    this.dataSource=products;
  }

  searchData(searchTerm: string){
    console.log("Busqueda:___: ",searchTerm)
    const dataFiltered = this.dataSource.filter(item =>
      item.categoria.toLowerCase().includes(searchTerm)
    );
    console.log("FIltrados: ", dataFiltered);

  }

}
