import { Component, inject, Input, OnInit } from '@angular/core';
import { ActasService } from '../../../../core/services/actas.service';

@Component({
  selector: 'app-procedings-update',
  standalone: true,
  imports: [],
  styles: ``,
  templateUrl: './procedings-update.component.html'
})
export class ProcedingsUpdateComponent implements OnInit {
  @Input('id') idActa!: string;
  private actasService = inject(ActasService);


  ngOnInit(): void {
    console.log("ID Acta recibido:", this.idActa);
    this.getActaById();
  }

  getActaById() {
    this.actasService.getById(this.idActa).subscribe({
      next: response => {
        console.log("Acta: ", response);
      },
      error: error => {
        console.log("Error al traer acta")
      }
    })
  }

}
