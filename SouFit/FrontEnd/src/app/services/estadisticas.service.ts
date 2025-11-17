import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Estadisticas {
  total_posts: number;
  total_rutinas: number;
  total_siguiendo: number;
  total_seguidores: number;
  total_likes_posts: number;
  total_comentarios_posts: number;
  total_rutinas_guardadas: number;
}

export interface ActividadReciente {
  fecha: string;
  cantidad: number;
}

export interface ProgresoRutina {
  id_rutina: number;
  nombre_rutina: string;
  duracion_semanas: number;
  fecha_creacion: string;
  posts_completados: number;
  total_dias: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private apiUrl = `${environment.apiUrl}/estadisticas`;

  constructor(private http: HttpClient) { }

  getEstadisticas(): Observable<{ estadisticas: Estadisticas, actividad_reciente: ActividadReciente[] }> {
    return this.http.get<{ estadisticas: Estadisticas, actividad_reciente: ActividadReciente[] }>(this.apiUrl);
  }

  getProgresoRutinas(): Observable<ProgresoRutina[]> {
    return this.http.get<ProgresoRutina[]>(`${this.apiUrl}/rutinas`);
  }
}

