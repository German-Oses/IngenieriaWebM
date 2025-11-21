import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(Storage);
  const apiUrl = environment.apiUrl;

  // Rutas que no requieren autenticación
  const publicRoutes = [
    '/login',
    '/register',
    '/verify-email',
    '/reset-password',
    '/forgot-password',
    '/health'
  ];

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Solo agregar token a rutas de la API que no sean públicas
  if (req.url.startsWith(apiUrl) && !isPublicRoute) {
    return from(storage.get('token')).pipe(
      switchMap(token => {
        if (token) {
          const clonedReq = req.clone({
            setHeaders: {
              'x-auth-token': token,
              'Authorization': `Bearer ${token}` // Soporte para ambos formatos
            }
          });
          return next(clonedReq);
        }
        // Si no hay token, continuar sin él (el servidor decidirá)
        return next(req);
      })
    );
  }

  // Para rutas públicas o que no son de la API, continuar sin modificar
  return next(req);
};
