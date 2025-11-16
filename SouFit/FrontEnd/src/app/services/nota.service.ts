import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotaEjercicio {
  id_nota?: number;
  id_usuario: number;
  id_ejercicio: number;
  nota: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  nombre_ejercicio?: string;
  grupo_muscular?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotaService {
  private apiUrl = `${environment.apiUrl}/notas`;

  constructor(private http: HttpClient) { }

  getNotas(): Observable<NotaEjercicio[]> {
    return this.http.get<NotaEjercicio[]>(this.apiUrl);
  }

  getNota(idEjercicio: number): Observable<NotaEjercicio> {
    return this.http.get<NotaEjercicio>(`${this.apiUrl}/ejercicio/${idEjercicio}`);
  }

  crearNota(nota: Partial<NotaEjercicio>): Observable<NotaEjercicio> {
    return this.http.post<NotaEjercicio>(this.apiUrl, nota);
  }

  eliminarNota(idEjercicio: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ejercicio/${idEjercicio}`);
  }
}

