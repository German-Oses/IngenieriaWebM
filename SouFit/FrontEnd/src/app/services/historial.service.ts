import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HistorialEntrenamiento {
  id_historial?: number;
  id_usuario: number;
  id_rutina?: number;
  id_ejercicio?: number;
  fecha_entrenamiento: string;
  duracion_minutos?: number;
  peso_usado?: number;
  repeticiones?: string;
  series?: number;
  notas?: string;
  nombre_rutina?: string;
  nombre_ejercicio?: string;
  fecha_registro?: string;
}

export interface EstadisticasEntrenamiento {
  total_entrenamientos: number;
  total_minutos: number;
  dias_entrenados: number;
  rutinas_diferentes: number;
  ejercicios_diferentes: number;
  promedio_minutos: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private apiUrl = `${environment.apiUrl}/historial`;

  constructor(private http: HttpClient) { }

  getHistorial(params?: {
    limit?: number;
    offset?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    id_rutina?: number;
    id_ejercicio?: number;
  }): Observable<HistorialEntrenamiento[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.http.get<HistorialEntrenamiento[]>(`${this.apiUrl}${query ? '?' + query : ''}`);
  }

  getEstadisticas(dias: number = 30): Observable<EstadisticasEntrenamiento> {
    return this.http.get<EstadisticasEntrenamiento>(`${this.apiUrl}/estadisticas?dias=${dias}`);
  }

  registrarEntrenamiento(entrenamiento: Partial<HistorialEntrenamiento>): Observable<HistorialEntrenamiento> {
    return this.http.post<HistorialEntrenamiento>(this.apiUrl, entrenamiento);
  }

  eliminarEntrenamiento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

