
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { ChatService } from './chat.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  

  private storageReady = new BehaviorSubject<boolean>(false);
  isAuthenticated = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router,
    private chatService: ChatService
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
    return this.http.post<{token: string, user: any}>(`${this.apiUrl}/login`, credentials).pipe(
      tap(async (res) => {
        if (res.token) {
          // Guardar token y usuario
          await this.storage.set('token', res.token);
          if (res.user) {
            await this.saveUser(res.user);
          }
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
      return this.http.get(`${environment.apiUrl}/profile`);
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
    try {
      // Limpiar el estado del chat antes de cerrar sesión
      this.chatService.desconectar();
      
      // Limpiar todo el almacenamiento
      await this.storage.clear();
      
      // Limpiar el estado de autenticación
      this.isAuthenticated.next(false);
      
      // Navegar al login y reemplazar el historial
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así navegar al login
      this.isAuthenticated.next(false);
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}