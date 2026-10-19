import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import * as XLSX from 'xlsx';
import { ParametroNegocioService } from '../../../core/services/parametro-negocio.service';
import { TokenService } from '../../../core/services/token.service';

export function nombreCompletoExcel(persona: {
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
} | null | undefined): string {
  return [persona?.primerNombre, persona?.segundoNombre, persona?.primerApellido, persona?.segundoApellido]
    .filter(Boolean).join(' ').trim().replace(/\s+/g, ' ') || '—';
}

@Injectable({ providedIn: 'root' })
export class ExcelInstitucionalService {
  private readonly parametrosService = inject(ParametroNegocioService);
  private readonly tokenService = inject(TokenService);

  async guardar(workbook: XLSX.WorkBook, fileName: string): Promise<void> {
    const idSecretaria = this.tokenService.getActiveSecretaryId();
    const contexto = await firstValueFrom(this.parametrosService.getContext().pipe(timeout(45000)));
    if (!idSecretaria || contexto.secretaria.idSecretaria !== idSecretaria
      || this.tokenService.getActiveSecretaryId() !== idSecretaria) {
      throw new Error('La secretaría activa cambió o no coincide con el reporte. Vuelve a generar el Excel.');
    }
    const tipo = contexto.secretaria.tipo;
    if (tipo !== 'M' && tipo !== 'D') {
      throw new Error('La secretaría no tiene un tipo municipal o departamental válido.');
    }
    const texto = (value: string | null | undefined) => value?.trim().replace(/\s+/g, ' ') || '—';
    const parametros = contexto.parametros;
    if (!parametros.nombreAlcaldia?.trim()) {
      throw new Error('Configura el nombre institucional de la secretaría antes de exportar.');
    }
    const entidad = tipo === 'D' ? 'Gobernación' : 'Alcaldía';
    const autoridad = tipo === 'D' ? 'Gobernador' : 'Alcalde';
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Información institucional', 'Valor'],
      [`Nombre de la ${entidad}`, texto(parametros.nombreAlcaldia)],
      [`Nombre del ${autoridad}`, texto(parametros.nombreAlcalde)],
      ['Secretaría activa', texto(contexto.secretaria.nombre)],
      ['Nombre de la secretaría en los parámetros', texto(parametros.nombreSecretaria)],
      ['Tipo de secretaría', tipo === 'D' ? 'Departamental' : 'Municipal'],
      ['Departamento', texto(contexto.departamento)],
      ['Correo institucional', texto(parametros.correoAlcaldia)],
      [`Dirección de la ${entidad}`, texto(parametros.direccionAlcaldia)],
      ['Teléfono de contacto', texto(parametros.contactoAlcaldia)],
      ['Código postal', texto(parametros.codigoPostal)],
    ]);
    sheet['!cols'] = [{ wch: 44 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Información institucional');
    XLSX.writeFile(workbook, fileName);
  }
}

export function excelErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (body && typeof body === 'object' && 'mensaje' in body && typeof body.mensaje === 'string') {
      return body.mensaje;
    }
    return 'No se pudo consultar la información institucional. Revisa la conexión y la configuración de la secretaría.';
  }
  return error instanceof Error ? error.message : 'No se pudo generar el Excel. Inténtalo nuevamente.';
}
