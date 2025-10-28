import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(Storage);
  const apiUrl = 'http://localhost:3000/api';

  // Evitamos agregar el token en login/register
  if (req.url.startsWith(apiUrl) && 
      !req.url.endsWith('/login') && 
      !req.url.endsWith('/register')) {

    return from(storage.get('token')).pipe(
      switchMap(token => {
        if (token) {
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
