import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { checkToken } from '../interceptors/token-interceptor.interceptor';

@Injectable({ providedIn: 'root' })
export class DefaultLogoCache {
  private readonly http = inject(HttpClient);
  readonly image$: Observable<Blob> = this.http.get(
    `${environment.URL_API}/parametros-negocio/logo-predeterminado`,
    { context: checkToken(), responseType: 'blob' },
  ).pipe(timeout(45000), shareReplay({ bufferSize: 1, refCount: false }));
}
