import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { checkToken } from '../../../core/interceptors/token-interceptor.interceptor';
import { IParametroNegocio } from '../../../core/models/parametro-negocio.model';
import { ISecretaria } from '../../../core/models/secretaria.model';
import { TokenService } from '../../../core/services/token.service';
import { DefaultLogoCache } from '../../../core/services/default-logo.service';

interface ContextoInstitucional {
  secretaria: ISecretaria;
  parametros: IParametroNegocio;
  departamento: string | null;
}

export interface InstitucionPdf {
  nombre: string;
  subtitulo: string;
  pie: string;
  logo: string;
  entidad: string;
  autoridad: string;
  parametros: IParametroNegocio;
}

export function textoPdf(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') || '—';
}

export function sexoPdf(value: string | null | undefined): string {
  const sexo = value?.trim().toUpperCase();
  return sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Femenino' : textoPdf(value);
}

export function sectorPdf(ubicacion: string | null | undefined): string {
  const zona = ubicacion?.trim().toLowerCase().replace(/\s+/g, ' ');
  if (zona === 'urbana' || zona === 'urbano' || zona === 'zona urbana') return 'Barrio';
  if (zona === 'rural' || zona === 'zona rural') return 'Vereda';
  return 'Sector';
}

@Injectable({ providedIn: 'root' })
export class PdfInstitucionalService {
  private readonly http = inject(HttpClient);
  private readonly token = inject(TokenService);
  private readonly defaultLogo = inject(DefaultLogoCache);

  async cargar(): Promise<InstitucionPdf> {
    const idSecretaria = this.token.getActiveSecretaryId();
    const contexto = await firstValueFrom(this.http.get<ContextoInstitucional>(
      `${environment.URL_API}/parametros-negocio/contexto-institucional`,
      { context: checkToken() },
    ).pipe(timeout(45000)));
    if (!idSecretaria || contexto.secretaria.idSecretaria !== idSecretaria) {
      throw new Error('La secretaría del reporte no coincide con la sesión activa. Vuelve a cargar la vista.');
    }
    const tipo = contexto.secretaria.tipo;
    if (tipo !== 'M' && tipo !== 'D') {
      throw new Error('La secretaría no tiene un tipo municipal o departamental válido.');
    }
    const nombre = textoPdf(contexto.parametros.nombreAlcaldia);
    if (nombre === '—') {
      throw new Error('Configura el nombre institucional de la secretaría antes de exportar.');
    }
    let logo = contexto.parametros.logoInstitucional?.trim() || '';
    if (!logo) {
      const blob = await firstValueFrom(this.defaultLogo.image$);
      logo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('No se pudo leer el logo institucional.'));
        reader.onerror = () => reject(new Error('No se pudo leer el logo institucional.'));
        reader.readAsDataURL(blob);
      });
    }
    if (this.token.getActiveSecretaryId() !== idSecretaria) {
      throw new Error('La secretaría activa cambió durante la exportación. Vuelve a generar el reporte.');
    }
    const departamento = contexto.departamento ? textoPdf(contexto.departamento) : '';
    return {
      nombre,
      subtitulo: departamento ? `${departamento} - República de Colombia` : 'República de Colombia',
      pie: departamento ? `${nombre} - ${departamento}` : nombre,
      logo,
      entidad: tipo === 'D' ? 'Gobernación' : 'Alcaldía',
      autoridad: tipo === 'D' ? 'Gobernador' : 'Alcalde',
      parametros: contexto.parametros,
    };
  }
}
