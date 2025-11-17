import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CalendarioEntrenamiento {
  id_calendario?: number;
  id_usuario: number;
  id_rutina?: number;
  fecha_entrenamiento: string;
  hora?: string;
  completado: boolean;
  notas?: string;
  nombre_rutina?: string;
  tipo_rutina?: string;
  nivel_dificultad?: string;
  fecha_creacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private apiUrl = `${environment.apiUrl}/calendario`;

  constructor(private http: HttpClient) { }

  getCalendario(mes?: number, año?: number): Observable<CalendarioEntrenamiento[]> {
    const params: any = {};
    if (mes) params.mes = mes;
    if (año) params.año = año;
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const query = queryParams.toString();
    return this.http.get<CalendarioEntrenamiento[]>(`${this.apiUrl}${query ? '?' + query : ''}`);
  }

  agregarEntrenamiento(entrenamiento: Partial<CalendarioEntrenamiento>): Observable<CalendarioEntrenamiento> {
    return this.http.post<CalendarioEntrenamiento>(this.apiUrl, entrenamiento);
  }

  marcarCompletado(id: number, completado: boolean = true): Observable<CalendarioEntrenamiento> {
    return this.http.put<CalendarioEntrenamiento>(`${this.apiUrl}/${id}/completado`, { completado });
  }

  eliminarEntrenamiento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

