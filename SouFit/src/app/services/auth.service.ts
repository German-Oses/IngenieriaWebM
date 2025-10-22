// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from } from 'rxjs';
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
 
    await this.storage.create();
    this.storageReady.next(true); 

    const token = await this.storage.get('token');
    if (token) {
      this.isAuthenticated.next(true);
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
       
          return new Observable(observer => observer.error('Storage not ready'));
        }
        return this.http.get(this.apiUrl);
      })
    );
  }

  async logout() {
    await this.storage.set('token', null); // Es más seguro setear a null que remover
    this.isAuthenticated.next(false);
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}