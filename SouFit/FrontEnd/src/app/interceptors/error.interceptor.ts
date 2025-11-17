import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastController = inject(ToastController);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Error del lado del servidor
        switch (error.status) {
          case 400:
            errorMessage = error.error?.error || error.error?.msg || 'Solicitud inválida';
            break;
          case 401:
            errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
            // Redirigir al login después de un breve delay
            setTimeout(() => {
              router.navigate(['/login']);
            }, 2000);
            break;
          case 403:
            errorMessage = 'No tienes permiso para realizar esta acción';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado';
            break;
          case 409:
            errorMessage = error.error?.error || 'El recurso ya existe';
            break;
          case 429:
            errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Por favor, intenta más tarde';
            break;
          case 503:
            errorMessage = 'Servicio no disponible. Por favor, intenta más tarde';
            break;
          default:
            errorMessage = error.error?.error || error.error?.msg || `Error ${error.status}: ${error.message}`;
        }
      }

      // Mostrar toast con el error
      presentErrorToast(toastController, errorMessage);

      // Log del error (solo en desarrollo)
      if (!error.url?.includes('/api/health')) {
        console.error('HTTP Error:', {
          url: error.url,
          status: error.status,
          message: errorMessage,
          error: error.error
        });
      }

      return throwError(() => error);
    })
  );
};

async function presentErrorToast(toastController: ToastController, message: string) {
  const toast = await toastController.create({
    message,
    duration: 4000,
    position: 'bottom',
    color: 'danger',
    buttons: [
      {
        text: 'Cerrar',
        role: 'cancel'
      }
    ]
  });
  await toast.present();
}

