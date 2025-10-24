import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {

  success(title: string, text: string = '') {
    Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Aceptar',
      timer: 2500,
    });
  }

  error(title: string, text: string = '') {
    Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Cerrar',
    });
  }

  warning(title: string, text: string = '') {
    Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Entendido',
    });
  }

  info(title: string, text: string = '') {
    Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonColor: '#0ea5e9',
      confirmButtonText: 'Ok',
    });
  }

  confirm(title: string, text: string, confirmText = 'Sí', cancelText = 'No'): Promise<boolean> {
    return Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
    }).then(result => result.isConfirmed);
  }
}
