import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private apiUrl = `${environment.apiUrl}/ubicacion`; 
  constructor(private http: HttpClient) { }

  getRegiones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/regiones`);
  }

  getComunas(idRegion: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/comunas/${idRegion}`);
  }
}