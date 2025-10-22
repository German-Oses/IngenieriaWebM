// src/app/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(Storage); // Inyectamos Storage
  const isApiUrl = req.url.startsWith('http://localhost:3000/api'); // URL de tu backend

  if (isApiUrl) {
    return from(storage.get('token')).pipe(
      switchMap(token => {
        if (token) {
          // Clonamos la petición y añadimos el header
          req = req.clone({
            setHeaders: { 'x-auth-token': token }
          });
        }
        return next(req);
      })
    );
  }
  return next(req);
};