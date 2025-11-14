
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  

  private storageReady = new BehaviorSubject<boolean>(false);
  isAuthenticated = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router
  ) {

    this.init();
  }

  async init() {
    try {
 
      await this.storage.create();
    
      this.storageReady.next(true); 

      const token = await this.storage.get('token');
      if (token) {
        this.isAuthenticated.next(true);
      } else {
        this.isAuthenticated.next(false);
      }
    } catch (e) {
      console.error("Error al iniciar Storage", e);
      this.storageReady.next(false);
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<{token: string}>(`${this.apiUrl}/login`, credentials).pipe(
      tap(async (res) => {
        if (res.token) {
         
          await this.storage.set('token', res.token);
          this.isAuthenticated.next(true);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  getUserProfile(): Observable<any> {
  return this.storageReady.pipe(
    switchMap(ready => {
      if (!ready) {
        return of(null);
      }
      return this.http.get('http://localhost:3000/api/profile');
    })
  );
}

  // Obtener el usuario actual desde el almacenamiento local
  async getCurrentUser(): Promise<any> {
    try {
      const user = await this.storage.get('user');
      return user;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Guardar datos del usuario
  async saveUser(userData: any) {
    try {
      await this.storage.set('user', userData);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }
  }


  async logout() {
    await this.storage.remove('token');
    await this.storage.remove('user');
    this.isAuthenticated.next(false);
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}