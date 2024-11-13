import { Component } from '@angular/core';
import { Products } from '../../interfaces/products.model';
import { productsList } from '../../../../core/data/products.data';
import { TableTemplateComponent } from '../../../../shared/components/table-template/table-template.component';
@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [TableTemplateComponent],
  templateUrl: './inventory-detail.component.html',
  styleUrl: './inventory-detail.component.scss'
})
export class InventoryDetailComponent {
  data = productsList;
}
