import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ejercicio {
  id_ejercicio?: number;
  id_usuario: number;
  nombre_ejercicio: string;
  descripcion?: string;
  tipo?: string;
  grupo_muscular?: string;
  dificultad?: 'Principiante' | 'Intermedio' | 'Avanzado';
  duracion_minutos?: number;
  equipamiento?: string;
  instrucciones?: string;
  url_media?: string;
  es_sistema?: boolean;
  fecha_publicacion?: string;
  creador_username?: string;
  total_likes?: number;
  total_guardados?: number;
  esta_guardado?: boolean;
  me_gusta?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EjercicioService {
  private apiUrl = `${environment.apiUrl}/ejercicios`;

  constructor(private http: HttpClient) { }

  // Obtener todos los ejercicios con filtros
  getEjercicios(filtros?: {
    tipo?: string;
    grupo_muscular?: string;
    dificultad?: string;
    busqueda?: string;
    limit?: number;
    offset?: number;
  }): Observable<Ejercicio[]> {
    let params = new URLSearchParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key as keyof typeof filtros]) {
          params.append(key, filtros[key as keyof typeof filtros] as string);
        }
      });
    }
    const queryString = params.toString();
    return this.http.get<Ejercicio[]>(`${this.apiUrl}${queryString ? '?' + queryString : ''}`);
  }

  // Obtener un ejercicio por ID
  getEjercicioById(id: number): Observable<Ejercicio> {
    return this.http.get<Ejercicio>(`${this.apiUrl}/${id}`);
  }

  // Crear un ejercicio
  createEjercicio(ejercicio: Partial<Ejercicio>): Observable<Ejercicio> {
    return this.http.post<Ejercicio>(`${this.apiUrl}`, ejercicio);
  }

  // Actualizar un ejercicio
  updateEjercicio(id: number, ejercicio: Partial<Ejercicio>): Observable<Ejercicio> {
    return this.http.put<Ejercicio>(`${this.apiUrl}/${id}`, ejercicio);
  }

  // Eliminar un ejercicio
  deleteEjercicio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Guardar ejercicio como favorito
  guardarEjercicio(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/guardar`, {});
  }

  // Quitar ejercicio de favoritos
  quitarEjercicioGuardado(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/guardar`);
  }

  // Obtener ejercicios guardados
  getEjerciciosGuardados(): Observable<Ejercicio[]> {
    return this.http.get<Ejercicio[]>(`${this.apiUrl}/usuario/guardados`);
  }

  // Reaccionar a un ejercicio
  reaccionarEjercicio(id: number, tipo_reaccion: string = 'like'): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reaccionar`, { tipo_reaccion });
  }
}

