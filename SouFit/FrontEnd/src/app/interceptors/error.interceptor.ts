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
      // Ignorar errores de health check o recursos estáticos
      if (error.url?.includes('/api/health') || 
          error.url?.includes('/assets/') ||
          error.url?.includes('.png') ||
          error.url?.includes('.jpg') ||
          error.url?.includes('.svg')) {
        return throwError(() => error);
      }

      let errorMessage = 'Ha ocurrido un error';
      let shouldRedirect = false;
      let redirectPath = '';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error de conexión: ${error.error.message}`;
      } else {
        // Error del lado del servidor
        switch (error.status) {
          case 0:
            errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet';
            break;
          case 400:
            errorMessage = error.error?.error || error.error?.msg || 'Solicitud inválida. Por favor, verifica los datos';
            break;
          case 401:
            errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
            shouldRedirect = true;
            redirectPath = '/login';
            break;
          case 403:
            errorMessage = 'No tienes permiso para realizar esta acción';
            break;
          case 404:
            errorMessage = error.error?.error || 'Recurso no encontrado';
            break;
          case 409:
            errorMessage = error.error?.error || error.error?.msg || 'El recurso ya existe';
            break;
          case 422:
            errorMessage = error.error?.error || error.error?.msg || 'Datos inválidos. Por favor, verifica la información';
            break;
          case 429:
            // Manejo mejorado de rate limiting
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.retryAfter) {
              const minutes = Math.ceil(error.error.retryAfter / 60);
              errorMessage = `Demasiadas solicitudes. Por favor, espera ${minutes} minuto(s) antes de intentar nuevamente`;
            } else {
              errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar nuevamente';
            }
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Por favor, intenta más tarde';
            break;
          case 502:
            errorMessage = 'Servidor no disponible. Por favor, intenta más tarde';
            break;
          case 503:
            errorMessage = 'Servicio no disponible temporalmente. Por favor, intenta más tarde';
            break;
          case 504:
            errorMessage = 'Tiempo de espera agotado. Por favor, intenta nuevamente';
            break;
          default:
            errorMessage = error.error?.error || 
                          error.error?.msg || 
                          error.error?.message ||
                          `Error ${error.status}: ${error.statusText || 'Error desconocido'}`;
        }
      }

      // Mostrar toast con el error (solo si no es un error silencioso)
      if (!error.error?.silent) {
        presentErrorToast(toastController, errorMessage).catch(err => {
          console.error('Error al mostrar toast:', err);
        });
      }

      // Log del error (solo en desarrollo)
      if (!environment.production) {
        console.error('HTTP Error:', {
          url: error.url,
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          error: error.error
        });
      }

      // Redirigir si es necesario
      if (shouldRedirect && redirectPath) {
        setTimeout(() => {
          router.navigate([redirectPath]).catch(err => {
            console.error('Error al redirigir:', err);
          });
        }, 2000);
      }

      return throwError(() => error);
    })
  );
};

async function presentErrorToast(toastController: ToastController, message: string): Promise<void> {
  try {
    const toast = await toastController.create({
      message,
      duration: 4000,
      position: 'bottom',
      color: 'danger',
      cssClass: 'error-toast',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel',
          handler: () => {
            toast.dismiss();
          }
        }
      ]
    });
    await toast.present();
  } catch (error) {
    console.error('Error al presentar toast:', error);
  }
}

// Importar environment para verificar modo producción
import { environment } from '../../environments/environment';
