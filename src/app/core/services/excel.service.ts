import { Injectable } from '@angular/core';
import { Workbook } from './../../../../node_modules/exceljs/index.d';
import * as fs from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private _workBook !: Workbook;

  constructor() { }

  downloadExcel(dataExcel: any): void {
    // Crea un objeto con el comportamiento similar de un libro excel
    this._workBook = new Workbook();
    // Podemos manipular su metadata como el nombre del creador
    this._workBook.creator = "Alcaldía de Almaguer";

    // Agrega una hoja dentro del libro
    this._workBook.addWorksheet('NucleoFamiliar');

    // Mediante xlsx podemos llamar los comportamientos como crear
    // writeBuffer() nos permite crear el libro y escribir sus datos
    // La pormesa debe recibir los datos que van en el excel
    this._workBook.xlsx.writeBuffer().then((data)=>{
      // Debemos convertir esos datos a un objeto blob
      const blob = new Blob([data]);
      // El cual mediante fs podemos guardar en un archivo con el nobre y extensión que deseamos
      fs.saveAs(blob, "Alcaldia de Almaguer.xlsx");
    });
  }
}
